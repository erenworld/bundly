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

console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));

const resolver = new Resolver(moduleMap, {
  extensions: ['.js'],
  hasCoreModules: false,
  rootDir: root,
});
const dependencyResolver = new DependencyResolver(resolver, hasteFS);

const seen = new Set();
const modules = new Map();
const queue = [entryPoint];

while (queue.length) {
  const module = queue.shift();

  if (seen.has(module)) {
    continue;
  }
  seen.add(module);
  queue.push(...dependencyResolver.resolve(module));

  // Resolve each dependency and store it based on their "name",
  // that is the actual occurrence in code via `require('<name>');`.
  const dependencyMap = new Map(
    hasteFS
      .getDependencies(module)
      .map((dependencyName) => [
        dependencyMap,
        resolver.resolveModule(module, dependencyName)
      ])
  );
  const code = fs.readFileSync(module, 'utf8');
  // Extract the "module body", in our case everything after `module.exports =`;
  const moduleBody = code.match(/module\.exports\s+=\s+(.*?);/)?.[1] || '';

  const metadata = {
    code: moduleBody || code,
    dependencyMap,
  };
  modules.set(module, metadata);
  queue.push(...dependencyMap.values());
}

console.log(chalk.bold(`❯ Found ${chalk.blue(seen.size)} files`));

// “Serialize” the bundle.
// Serialization is the process of taking the dependency information and all 
// code to turn it into a bundle that we can be run as a single file in a browser.
console.log(chalk.bold(`❯ Serializing bundle`));
// Go through each module (backwards, to process the entry-point last).
for (const [module, metadata] of Array.from(modules).reverse()) {
  let { code } = metadata;
  for (const [dependencyName, dependencyPath] of metadata.dependencyMap) {
    // Inline the module body of the dependency into the module that requires it.
  code = code.replace(
    new RegExp(
      // Escape `.` and `/`.
      `require\\(('|")${dependencyName.replace(/[\/.]/g, '\\$&')}\\1\\)`,
    ),
    modules.get(dependencyPath).code,
  )};
  metadata.code = code;
}

console.log(modules.get(entryPoint).code);
