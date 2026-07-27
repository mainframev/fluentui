import * as fs from 'node:fs';
import * as path from 'node:path';

import { workspaceRoot } from '@nx/devkit';

/**
 * Regression tests for the `patch-package` patches this repo applies on `postinstall`.
 *
 * They run against the patched files in `node_modules`, so they also verify that the patches were
 * applied at all - the whole build tooling silently misbehaves without them.
 */
describe(`patches`, () => {
  describe(`@swc-node/register`, () => {
    // the package `exports` map doesn't expose internals, and this is exactly what the patch touches
    const patchedModulePath = path.join(workspaceRoot, 'node_modules/@swc-node/register/lib/read-default-tsconfig.js');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { tsCompilerOptionsToSwcConfig } = require(patchedModulePath);

    it(`should map TypeScript 6 "pathsBasePath" to the swc "baseUrl"`, () => {
      const actual = tsCompilerOptionsToSwcConfig(
        { paths: { '@proj/one': ['./packages/one/src/index.ts'] }, pathsBasePath: '/workspace' },
        'file.ts',
      );

      expect(actual.baseUrl).toEqual('/workspace');
      expect(actual.paths).toEqual({ '@proj/one': ['/workspace/packages/one/src/index.ts'] });
    });

    it(`should keep honouring an explicit "baseUrl"`, () => {
      const actual = tsCompilerOptionsToSwcConfig(
        { paths: { '@proj/one': ['./packages/one/src/index.ts'] }, baseUrl: '/legacy' },
        'file.ts',
      );

      expect(actual.baseUrl).toEqual('/legacy');
      expect(actual.paths).toEqual({ '@proj/one': ['/legacy/packages/one/src/index.ts'] });
    });

    it(`should not require a base when there are no path aliases`, () => {
      expect(tsCompilerOptionsToSwcConfig({}, 'file.ts').baseUrl).toBeUndefined();
      expect(tsCompilerOptionsToSwcConfig({ paths: {} }, 'file.ts').baseUrl).toBeUndefined();
    });

    it(`should fail with an actionable error instead of silently breaking path aliases`, () => {
      expect(() =>
        tsCompilerOptionsToSwcConfig({ paths: { '@proj/one': ['./packages/one/src/index.ts'] } }, 'file.ts'),
      ).toThrow(/Cannot resolve tsconfig "paths" for "file\.ts": neither "baseUrl" nor "pathsBasePath" is set/);
    });

    /**
     * Nx executes the workspace TypeScript (plugins, generators, executors, `just.config.ts`, ...)
     * through `@swc-node/register`, handing it the raw `compilerOptions` of the root
     * `tsconfig.base.json`. `@swc-node/register@1.9.2` falls back to the pre TypeScript 6 default
     * of `esModuleInterop: false` whenever the option is not spelled out, which drops the interop
     * wrappers and turns every `import x from '<commonjs module>'` into `undefined` at runtime.
     */
    it(`should fall back to "esModuleInterop: false", which the root tsconfig has to compensate for`, () => {
      expect(tsCompilerOptionsToSwcConfig({}, 'file.ts').esModuleInterop).toBe(false);

      const rootTsConfig = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'tsconfig.base.json'), 'utf-8'));

      expect(rootTsConfig.compilerOptions.esModuleInterop).toBe(true);
      expect(
        tsCompilerOptionsToSwcConfig({ esModuleInterop: rootTsConfig.compilerOptions.esModuleInterop }, 'file.ts')
          .esModuleInterop,
      ).toBe(true);
    });
  });
});
