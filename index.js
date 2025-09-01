import HasteMap from 'jest-haste-map';
import { cpus } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import chalk from 'chalk';
import yargs from 'yargs';
import Resolver from 'jest-resolve';
import { DependencyResolver } from 'jest-resolve-dependencies';
import fs from 'fs';

const root = join(dirname(fileURLToPath(import.meta.url)), 'product');

const hasteMapOptions = {
  extensions: ['js'],
  maxWorkers: cpus().length,
  name: 'jest-bundler',
  platforms: [],
  rootDir: root,
  roots: [root],
};

const map = new HasteMap(hasteMapOptions);
await map.setupCachePath(hasteMapOptions);
const { hasteFS, moduleMap } = await map.build();
console.log(hasteFS.getAllFiles());
// ['/path/to/product/apple.js', '/path/to/product/banana.js', …]

const options = yargs(process.argv).argv;
const entryPoint = resolve(process.cwd(), options.entryPoint);
if (!hasteFS.exists(entryPoint)) {
  throw new Error(
    '`--entry-point` does not exist. Please provide a path to a valid file.',
  );
}

const resolver = new Resolver(moduleMap, {
  extensions: ['.js'],
  hasCoreModules: false,
  rootDir: root,
});
const dependencyResolver = new DependencyResolver(resolver, hasteFS);

const seen = new Set();
const modules = new Map();
const queue = [entryPoint];
let id = 0;

while (queue.length) {
  const module = queue.shift();

  if (seen.has(module)) {
    continue;
  }
  seen.add(module);

  // Resolve each dependency and store it based on their "name",
  // that is the actual occurrence in code via `require('<name>');`.
  const dependencyMap = new Map(
    hasteFS
      .getDependencies(module)
      .map((dependencyName) => [
        dependencyName,
        resolver.resolveModule(module, dependencyName),
      ]),
  );

  const code = fs.readFileSync(module, 'utf8');
  const metadata = {
    id: id++,
    code,
    dependencyMap,
  };
  modules.set(module, metadata);
  queue.push(...dependencyMap.values()); // TODOS: filter here and handle undefined
}

console.log(chalk.bold(`❯ Found ${chalk.blue(seen.size)} files`));

console.log(chalk.bold(`❯ Serializing bundle`));
// Wrap modules with `define(<id>, function(module, exports, require) { <code> });`
const wrapModule = (id, code) => 
  `define(${id}, function(module, exports, require) {\n${code}})`;
// The code for each module gets added to this array.
const output = [];
for (const [module, metadata] of Array.from(modules).reverse()) {
  let { id, code } = metadata;
  
  for (const [dependencyName, dependencyPath] of metadata.dependencyMap) {
    const dependency = modules.get(dependencyPath);
    // Swap out the reference the required module with the generated
    // module it. We use regex for simplicity. A real bundler would likely
    // do an AST transform using Babel or similar.
    // TODOS: implement AST from scratch and compare with Babel's AST
    code = code.replace(
      new RegExp(
        `require\\(('|")${dependencyName.replace(/[\/.]/g, '\\$&')}\\1\\)`,
      ),
      `require(${dependency.id})`,
    );
  }
  // Wrap the code and add it to our output array.
  output.push(wrapModule(id, code));
} 

// Add the `require`-runtime at the beginning of our bundle.
output.unshift(fs.readFileSync('./require.js', 'utf-8'));
// And require the entry point at the end of the bundle.
output.push(['requireModule(0);']);
// Write it to stdout.
console.log(output.join('\n'));

if (options.output) {
  fs.writeFileSync(options.output, output.join('\n'), 'utf8');
}