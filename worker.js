// If we want to build a fast test framework, we need to use all available CPUs.
// Node.js recently received support for which allows to parallelize work across
// threads within the same process.
const fs = require("fs");

exports.runTest = async function (testFile) {
  const code = await fs.promises.readFile(testFile, "utf8");
  const testResult = {
    success: false,
    errorMessage: null,
  };

  try {
    eval(code);
    testResult.success = true;
  } catch (err) {
    testResult.errorMessage = err.message;
  }
  console.log(testFile + ":\n" + code);

  return testResult;
};

// assertion framework
const expect = (received) => ({
  toBe: (expected) => {
    if (received !== expected) {
      throw new Error(`Expected ${expected} but received ${received}.`);
    }
    return true;
  },
});
