import { glob } from "glob";
import JestHasteMap from "jest-haste-map";
import { cpus, platform } from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { runTest } from "./worker.mjs";

// const testFiles = glob.sync("**/*.test.js");
// console.log(testFiles); // ['tests/01.test.js', 'tests/02.test.js', …]

const root = dirname(fileURLToPath(import.meta.url));
const hasteMapOptions = {
  extensions: ["js"],
  maxWorkers: cpus().length,
  name: "bundly",
  platforms: [],
  rootDir: root,
  roots: [root],
};

const hasteMap = new JestHasteMap(hasteMapOptions);
await hasteMap.setupCachePath(hasteMapOptions);

// Build and return an in-memory HasteFS ("Haste File System") instance.
const { hasteFS } = await hasteMap.build();

const testFiles = hasteFS.matchFilesWithGlob(["**/*.test.js"]);

// ['/path/to/tests/01.test.js', '/path/to/tests/02.test.js', …]
console.log(testFiles);

await Promise.all(
  Array.from(testFiles).map(async (testFile) => {
    console.log(await runTest(testFile));
  })
);
