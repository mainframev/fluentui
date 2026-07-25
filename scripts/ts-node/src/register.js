const tsNode = require('ts-node');

tsNode.register({
  // https://github.com/TypeStrong/ts-node#skipproject - don't read tsconfig within ts-node
  skipProject: true,

  // @deprecated: we cannot use this until new version of ts-node is released https://github.com/TypeStrong/ts-node/pull/2062
  // swc: true,
  // remove this once `swc` will start working again
  transpileOnly: true,

  /**
   * `skipProject` makes ts-node fall back to its own defaults, which include the `node10`
   * module resolution TypeScript 6 errors on (TS5107). These options mirror the ones the
   * `just-task` patch applies for the very same reason - the sources loaded here are executed
   * directly by node, so they are emitted as CommonJS, and `bundler` keeps the extensionless
   * relative/`index` resolution `node10` provided.
   */
  compilerOptions: {
    target: 'ES2022',
    module: 'CommonJS',
    moduleResolution: 'bundler',
    esModuleInterop: true,
  },
});
