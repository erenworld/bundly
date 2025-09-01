// If we want to build a fast test framework, we need to use all available CPUs.
// Node.js recently received support for which allows to parallelize work across
// threads within the same process.
const fs = require("fs");
const expect = require("expect");
const mock = require("jest-mock");
const { describe, it, run, resetState } = require("jest-circus");
const vm = require("vm");
const NodeEnvironment = require("jest-environment-node").default;
const { dirname, basename, join } = require("path");

exports.runTest = async function (testFile) {
  const code = await fs.promises.readFile(testFile, "utf8");
  const testResult = {
    success: false,
    errorMessage: null,
  };

  let testName;
  try {
    const describeFns = [];
    let currentDescribeFn;
    const describe = (name, fn) => describeFns.push([name, fn]);
    const it = (name, fn) => currentDescribeFn.push([name, fn]);

    resetState();
    // eval(code);
    let environment;
    const customRequire = (fileName) => {
      const code = fs.readFileSync(join(dirname(testFile), fileName), "utf8");
      // Define a function in the `vm` context and return it.
      const moduleFactory = vm.runInContext(
        `(function(module) {${code}})`,
        environment.getVmContext()
      );
      const module = { exports: {} };
      // Run the sandboxed function with our module object.
      moduleFactory(module);
      return module.exports;
    };
    environment = new NodeEnvironment({
      projectConfig: {
        testEnvironmentOptions: {
          describe,
          it,
          expect,
          mock,
        },
      },
    });
    // Use `customRequire` to run the test file.
    customRequire(basename(testFile));

    const { testResults } = await run();
    testResult.testResults = testResult;
    testResult.success = testResults.every((result) => !result.errors.length);

    testResult.success = true;
  } catch (err) {
    testResult.errorMessage = testName + ": " + err.message;
  }
  console.log(testFile + ":\n" + code);

  return testResult;
};
