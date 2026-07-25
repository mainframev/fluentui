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
    const patchedModulePath = path.join(
      workspaceRoot,
      'node_modules/@swc-node/register/lib/read-default-tsconfig.js',
    );
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
  });
});
