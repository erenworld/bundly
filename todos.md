- [`jest-runtime`](https://github.com/facebook/jest/tree/master/packages/jest-runtime), [`jest-resolve`](https://github.com/facebook/jest/tree/master/packages/jest-resolve) and [`jest-transform`](https://github.com/facebook/jest/tree/master/packages/jest-transform)

- Print the name of every `describe`/`it`, including passed tests.
- Print a summary of how many tests and assertions passed or failed, and how long the test run took.
- Ensure there is at least one test in a file using `it`, and fail the test if there aren’t any assertions.
- Inject `describe`, `it`, `expect` and `mock` using a “fake module” that can be loaded via `require('best')`.
- _Medium_: Transform the test code using Babel or TypeScript ahead of execution.
- _Medium:_ Add a configuration file and command line flags to customize test runs, like changing the output colors, limiting the number of worker processes or a `bail` option that exits as soon as one test fails.
- _Medium:_ Add a feature to record and compare snapshots.
- _Advanced:_ Add a watch mode that re-runs tests when they change, using `jest-haste-map`’s [`watch`](https://github.com/facebook/jest/blob/04b75978178ccb31bccb9f9b2f8a0db2fecc271e/packages/jest-haste-map/src/index.ts#L75) option and listening to changes via `hasteMap.on('change', (changeEvent) => { … })`.
- _Advanced:_ Make use of `jest-runtime` and `jest-resolve` to provide a full module and `require` implementation.
- _Advanced_: What would it take to collect code coverage? How can we transform our test code to keep track of which lines of code were run?
*   Add a `--minify` flag that runs a minifier like [`terser`](https://github.com/terser/terser) on each individual file in the bundle.
*   Add a cache that will store transformed files and only re-compile files that have changed.
_Medium:_ Learn about [source maps](https://firefox-source-docs.mozilla.org/devtools-user/debugger/how_to/use_a_source_map/index.html) and generate the corresponding `.map` file for your bundle.
*   _Medium:_ Add a `--dev` option that starts a HTTP server that serves the bundled code through an HTTP endpoint.
*   _Medium:_ After implementing the HTTP server, make use of `jest-haste-map`’s [`watch`](https://github.com/facebook/jest/blob/04b75978178ccb31bccb9f9b2f8a0db2fecc271e/packages/jest-haste-map/src/index.ts#L75) function to listen for changes and re-bundle automatically.
*   _Advanced_: Learn about [Import Maps](https://blog.logrocket.com/es-modules-in-browsers-with-import-maps/) and change the bundler from being `require` based to work with native ESM!
*   _Advanced_: Hot reloading: Adjust the runtime so it can update modules by first de-registering and then re-running the module and all of its dependencies.
*   _Advanced_: Rewrite the above bundler in another programming language like Rust.

- [node resolution algorithm](https://nodejs.org/api/modules.html#modules_all_together)
- we have to implement the entire [node resolution algorithm](https://nodejs.org/api/modules.html#modules_all_together) to figure out which file it maps to. For example, a module can usually be required without providing a file extension, or a package can redirect its main module through an entry in its `package.json`.

-------
