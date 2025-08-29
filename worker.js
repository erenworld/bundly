// If we want to build a fast test framework, we need to use all available CPUs.
// Node.js recently received support for which allows to parallelize work across
// threads within the same process.

const fs = require("fs");

exports.runTest = async function (testFile) {
  const code = await fs.promises.readFile(testFile, "utf8");

  return testFile + ':\n' + code;
};
