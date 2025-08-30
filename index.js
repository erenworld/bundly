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

const allFiles = new Set();
const queue = [entryPoint];

while (queue.length) {
  const module = queue.shift();

  if (allFiles.has(module)) {
    continue;
  }
  allFiles.add(module);
  queue.push(...dependencyResolver.resolve(module));
}

console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));
console.log(Array.from(allFiles));
// node index.mjs --entry-point product/entry-point.js


// “Serialize” the bundle.
// Serialization is the process of taking the dependency information and all 
// code to turn it into a bundle that we can be run as a single file in a browser.
console.log(chalk.bold(`❯ Serializing bundle`));
const allCodes = [];
await Promise.all(
  Array.from(allFiles).map(async (file) => {
    const code = await fs.promises.readFile(file, 'utf8');
    allCodes.push(code);
  })
)
console.log(allCode.join('\n'));
