import JestHasteMap from "jest-haste-map";
import { cpus } from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Worker } from "jest-worker";
import { join } from "path";

const root = dirname(fileURLToPath(import.meta.url));
const hasteMapOptions = {
  extensions: ["js"],
  maxWorkers: cpus().length,
  name: "best-test-framework",
  platforms: [],
  rootDir: root,
  roots: [root],
};

const hasteMap = new JestHasteMap(hasteMapOptions);
await hasteMap.setupCachePath(hasteMapOptions);
const { hasteFS } = await hasteMap.build();
const testFiles = hasteFS.matchFilesWithGlob(["**/*.test.js"]);

const worker = new Worker(join(root, "worker.js"), {
  enableWorkerThreads: true,
});

await Promise.all(
  Array.from(testFiles).map(async (testFile) => {
    const testResult = await worker.runTest(testFile);
    console.log(testResult);
  })
);

worker.end();
