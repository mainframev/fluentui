import { type ExecutorContext, logger, serializeJson } from '@nx/devkit';
import {
  Extractor,
  type IExtractorInvokeOptions,
  type ExtractorConfig,
  type ExtractorResult,
} from '@microsoft/api-extractor';
import { basename, join } from 'node:path';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

import { type TsConfig } from '../../types';

import { type GenerateApiExecutorSchema } from './schema';
import executor from './executor';
import { isCI } from './lib/shared';

const fixturesRootDir = join(__dirname, '__fixtures__');

jest.mock('node:child_process', () => {
  return {
    ...jest.requireActual('node:child_process'),
    execSync: jest.fn(),
  };
});

const options: GenerateApiExecutorSchema = {};
const _context: ExecutorContext = {
  root: fixturesRootDir,
  cwd: process.cwd(),
  isVerbose: true,
  projectName: 'proj',
  projectsConfigurations: {
    projects: { proj: { root: '' } },
    version: 2,
  },
  nxJsonConfiguration: {},
  projectGraph: { nodes: {}, dependencies: {} },
};

const execSyncMock = execSync as jest.Mock;

function cleanup() {
  // Remove all contents of the fixtures directory but keep the directory itself
  const entries = readdirSync(fixturesRootDir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = join(fixturesRootDir, entry.name);
    if (fullPath.endsWith('.gitkeep')) {
      return;
    }
    rmSync(fullPath, { recursive: true, force: true });
  });
}

function prepareFixture(type: 'valid' | 'invalid', config: { extractorConfigPath?: string }) {
  const { extractorConfigPath = 'config/api-extractor.json' } = config;

  const projRoot = mkdtempSync(join(fixturesRootDir, 'proj-'));

  if (type === 'valid') {
    writeFileSync(
      join(projRoot, 'package.json'),
      serializeJson({ name: `@proj/proj`, types: 'dist/index.d.ts' }),
      'utf-8',
    );
    writeFileSync(
      join(projRoot, 'tsconfig.json'),
      serializeJson({
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          noEmit: true,
        },
        include: [],
        files: [],
        references: [
          {
            path: './tsconfig.lib.json',
          },
        ],
      }),
      'utf-8',
    );
    writeFileSync(
      join(projRoot, 'tsconfig.lib.json'),
      serializeJson({
        extends: './tsconfig.json',
        compilerOptions: {
          emitDeclarationOnly: true,
          declarationDir: 'dts',
        },
        include: ['src/index.ts'],
      }),
      'utf-8',
    );
    mkdirSync(join(projRoot, 'config'));
    writeFileSync(
      join(projRoot, extractorConfigPath),
      serializeJson({
        mainEntryPointFilePath: '<projectFolder>/dts/index.d.ts',
        apiReport: {
          enabled: true,
        },
        docModel: {
          enabled: false,
        },
        dtsRollup: {
          enabled: true,
        },
      }),
      'utf-8',
    );
  }

  const context = {
    ..._context,
    projectsConfigurations: {
      ..._context.projectsConfigurations,
      projects: {
        ..._context.projectsConfigurations.projects,
        proj: {
          root: basename(projRoot),
        },
      },
    },
  };

  return {
    context,
    paths: { projRoot },
  };
}

describe('GenerateApi Executor', () => {
  afterEach(() => {
    cleanup();
  });

  it(`should handle invalid inputs`, async () => {
    const { paths, context } = prepareFixture('invalid', {});

    try {
      await executor(options, context);
    } catch (err) {
      expect(err).toMatchInlineSnapshot(`[Error: ${paths.projRoot}/tsconfig.json doesn't exist]`);
    }

    writeFileSync(join(paths.projRoot, 'tsconfig.json'), '{}', 'utf-8');

    try {
      await executor(options, context);
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Cannot find api-extractor.json at "${paths.projRoot}/config/api-extractor.json"]`,
      );
    }
  });

  it('can run', async () => {
    const { paths, context } = prepareFixture('valid', {});

    const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(() => {
      return { succeeded: true } as ExtractorResult;
    });

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(paths.projRoot, 'dts'));
      writeFileSync(join(paths.projRoot, 'dts', 'index.d.ts'), 'export const foo:number;', 'utf-8');
    });

    const output = await executor(options, context);

    const [tscCommand, tscOptions] = execSyncMock.mock.calls.flat();

    // the transient config which turns path aliases off is unique per invocation
    expect(tscCommand).toMatch(
      new RegExp(
        `^tsc -p ${paths.projRoot}/tsconfig\\.__generated-no-path-aliases-generate-api-\\d+-\\d+-[a-f0-9]+-tsconfig\\.lib\\.json --pretty --emitDeclarationOnly$`,
      ),
    );
    expect(tscOptions).toEqual({ stdio: 'inherit' });
    expect(readdirSync(paths.projRoot).filter(fileName => fileName.startsWith('tsconfig.__generated'))).toEqual([]);

    const [extractorConfig, extractorArgs] = ExtractorInvokeSpy.mock.calls.flat() as [
      ExtractorConfig,
      IExtractorInvokeOptions,
    ];

    expect((extractorConfig.overrideTsconfig as TsConfig).compilerOptions).toEqual({
      declarationDir: 'dts',
      emitDeclarationOnly: true,
      isolatedModules: false,
      paths: undefined,
      skipLibCheck: false,
    });
    expect(extractorConfig.skipLibCheck).toBe(false);

    const actualLocalBuildValue = isCI() ? false : true;

    expect(extractorArgs).toEqual({
      localBuild: actualLocalBuildValue,
      showDiagnostics: false,
      showVerboseMessages: true,
    });

    expect(output.success).toBe(true);
  });

  it('support schema config', async () => {
    const { context, paths } = prepareFixture('valid', { extractorConfigPath: 'api-extractor.json' });

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(paths.projRoot, 'dts'));
      writeFileSync(join(paths.projRoot, 'dts', 'index.d.ts'), 'export const foo:number;', 'utf-8');
    });

    const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(() => {
      return { succeeded: true } as ExtractorResult;
    });

    const output = await executor(
      { ...options, config: '{projectRoot}/api-extractor.json', diagnostics: true, local: false },
      context,
    );

    const [extractorConfig, extractorArgs] = ExtractorInvokeSpy.mock.calls.flat() as [
      ExtractorConfig,
      IExtractorInvokeOptions,
    ];

    expect(extractorConfig).toEqual(expect.any(Object));
    expect(extractorArgs).toEqual({
      localBuild: false,
      showDiagnostics: true,
      showVerboseMessages: true,
    });

    expect(output.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Export subpath resolution
// ─────────────────────────────────────────────────────────────────────────────

describe('GenerateApi Executor – export subpath resolution', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Creates a fixture with configurable export map entries.
   * The primary api-extractor.json uses a relative path from config/ to dts/src/.
   */
  function prepareExportFixture(config: { wildcardSubDirs?: string[]; namedExports?: string[] }) {
    const { wildcardSubDirs = [], namedExports = [] } = config;
    const { paths, context } = prepareFixture('valid', {});
    const { projRoot } = paths;

    const exports: Record<string, unknown> = {
      '.': { types: './dist/index.d.ts', import: './lib/index.js' },
    };
    if (namedExports.length > 0) {
      for (const name of namedExports) {
        exports[`./${name}`] = { types: `./dist/${name}/index.d.ts`, import: `./lib/${name}/index.js` };
      }
    }
    if (wildcardSubDirs.length > 0) {
      exports['./*'] = { types: './dist/items/*/index.d.ts', import: './lib/items/*/index.js' };
    }
    exports['./package.json'] = './package.json';

    writeFileSync(
      join(projRoot, 'package.json'),
      serializeJson({ name: '@proj/proj', types: 'dist/index.d.ts', exports }),
      'utf-8',
    );

    writeFileSync(
      join(projRoot, 'config', 'api-extractor.json'),
      serializeJson({
        mainEntryPointFilePath: '../dts/src/index.d.ts',
        apiReport: { enabled: false },
        docModel: { enabled: false },
        dtsRollup: { enabled: true },
        tsdocMetadata: { enabled: false },
      }),
      'utf-8',
    );

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(projRoot, 'dts', 'src'), { recursive: true });
      writeFileSync(join(projRoot, 'dts', 'src', 'index.d.ts'), 'export const root: 1;', 'utf-8');
      for (const name of namedExports) {
        mkdirSync(join(projRoot, 'dts', 'src', name), { recursive: true });
        writeFileSync(join(projRoot, 'dts', 'src', name, 'index.d.ts'), `export const ${name}: string;`, 'utf-8');
      }
      for (const name of wildcardSubDirs) {
        mkdirSync(join(projRoot, 'dts', 'src', 'items', name), { recursive: true });
        writeFileSync(
          join(projRoot, 'dts', 'src', 'items', name, 'index.d.ts'),
          `export const value: string;`,
          'utf-8',
        );
      }
    });

    return { paths, context };
  }

  // ── Wildcard exports ──────────────────────────────────────────────────────

  it('generates correct configs for each wildcard sub-directory', async () => {
    const subDirs = ['alpha', 'beta', 'gamma'];
    const { paths, context } = prepareExportFixture({ wildcardSubDirs: subDirs });

    const capturedConfigs: ExtractorConfig[] = [];
    jest.spyOn(Extractor, 'invoke').mockImplementation(cfg => {
      capturedConfigs.push(cfg);
      return { succeeded: true } as ExtractorResult;
    });

    const output = await executor({ ...options, exportSubpaths: true }, context);

    // primary (1) + one per sub-directory
    expect(capturedConfigs).toHaveLength(1 + subDirs.length);
    expect(output.success).toBe(true);

    const wildcardConfigs = capturedConfigs.slice(1);
    for (const name of subDirs) {
      const cfg = wildcardConfigs.find(c => c.mainEntryPointFilePath.includes(`items/${name}/`))!;
      expect(cfg.mainEntryPointFilePath).toContain(`items/${name}/index.d.ts`);
      expect(cfg.untrimmedFilePath).toBe(join(paths.projRoot, 'dist', 'items', name, 'index.d.ts'));
      expect(cfg.apiReportEnabled).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(cfg.reportFilePath).toBe(join(paths.projRoot, 'etc', `${name}.api.md`));
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(cfg.reportTempFilePath).toBe(join(paths.projRoot, 'temp', `${name}.api.md`));
    }
  });

  it('skips wildcard exports with no types field', async () => {
    const { paths, context } = prepareFixture('valid', {});
    const { projRoot } = paths;

    writeFileSync(
      join(projRoot, 'package.json'),
      serializeJson({
        name: '@proj/proj',
        types: 'dist/index.d.ts',
        exports: {
          '.': { import: './lib/index.js' },
          './*': { import: './lib/items/*/index.js' }, // no types field
          './package.json': './package.json',
        },
      }),
      'utf-8',
    );

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(projRoot, 'dts'));
      writeFileSync(join(projRoot, 'dts', 'index.d.ts'), 'export const x: 1;', 'utf-8');
    });

    const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(
      () =>
        ({
          succeeded: true,
        } as ExtractorResult),
    );

    await executor(options, context);

    expect(ExtractorInvokeSpy).toHaveBeenCalledTimes(1); // primary only
  });

  it('skips wildcard expansion when the resolved declaration directory does not exist', async () => {
    const { paths, context } = prepareFixture('valid', {});
    const { projRoot } = paths;

    writeFileSync(
      join(projRoot, 'package.json'),
      serializeJson({
        name: '@proj/proj',
        types: 'dist/index.d.ts',
        exports: {
          '.': { types: './dist/index.d.ts', import: './lib/index.js' },
          './*': { types: './dist/items/*/index.d.ts', import: './lib/items/*/index.js' },
        },
      }),
      'utf-8',
    );

    writeFileSync(
      join(projRoot, 'config', 'api-extractor.json'),
      serializeJson({
        mainEntryPointFilePath: '../dts/src/index.d.ts',
        apiReport: { enabled: false },
        docModel: { enabled: false },
        dtsRollup: { enabled: true },
        tsdocMetadata: { enabled: false },
      }),
      'utf-8',
    );

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(projRoot, 'dts', 'src'), { recursive: true });
      writeFileSync(join(projRoot, 'dts', 'src', 'index.d.ts'), 'export const x: 1;', 'utf-8');
      // dts/src/items/ intentionally NOT created
    });

    const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(
      () =>
        ({
          succeeded: true,
        } as ExtractorResult),
    );

    const output = await executor(options, context);

    expect(ExtractorInvokeSpy).toHaveBeenCalledTimes(1); // primary only
    expect(output.success).toBe(true);
  });

  it.each([{ exportSubpaths: false } as const, {} as const])(
    'skips export subpath expansion when exportSubpaths=%j',
    async overrides => {
      const subDirs = ['alpha', 'beta'];
      const { context } = prepareExportFixture({ wildcardSubDirs: subDirs });

      const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(
        () =>
          ({
            succeeded: true,
          } as ExtractorResult),
      );

      const output = await executor({ ...options, ...overrides }, context);

      expect(ExtractorInvokeSpy).toHaveBeenCalledTimes(1);
      expect(output.success).toBe(true);
    },
  );

  // ── Named exports ────────────────────────────────────────────────────────

  it('generates correct config for named export ./utils', async () => {
    const { paths, context } = prepareExportFixture({ namedExports: ['utils'] });

    const capturedConfigs: ExtractorConfig[] = [];
    jest.spyOn(Extractor, 'invoke').mockImplementation(cfg => {
      capturedConfigs.push(cfg);
      return { succeeded: true } as ExtractorResult;
    });

    await executor({ ...options, exportSubpaths: true }, context);

    // primary + utils — "." and "./package.json" are skipped
    expect(capturedConfigs).toHaveLength(2);

    const utilsConfig = capturedConfigs[1];
    expect(utilsConfig.mainEntryPointFilePath).toContain('utils/index.d.ts');
    expect(utilsConfig.untrimmedFilePath).toBe(join(paths.projRoot, 'dist', 'utils', 'index.d.ts'));
    expect(utilsConfig.apiReportEnabled).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    expect(utilsConfig.reportFilePath).toContain('utils.api.md');
  });

  it('disables apiReport for named exports when exportSubpaths: { apiReport: false }', async () => {
    const { context } = prepareExportFixture({ namedExports: ['utils'] });

    const capturedConfigs: ExtractorConfig[] = [];
    jest.spyOn(Extractor, 'invoke').mockImplementation(cfg => {
      capturedConfigs.push(cfg);
      return { succeeded: true } as ExtractorResult;
    });

    await executor({ ...options, exportSubpaths: { apiReport: false } }, context);

    const utilsConfig = capturedConfigs[1];
    expect(utilsConfig.apiReportEnabled).toBe(false);
  });

  it('processes both named and wildcard exports in a single package', async () => {
    const subDirs = ['alpha', 'beta'];
    const { context } = prepareExportFixture({ wildcardSubDirs: subDirs, namedExports: ['utils'] });

    const ExtractorInvokeSpy = jest.spyOn(Extractor, 'invoke').mockImplementation(
      () =>
        ({
          succeeded: true,
        } as ExtractorResult),
    );

    const output = await executor({ ...options, exportSubpaths: true }, context);

    // primary (1) + utils (1) + wildcard sub-dirs (2)
    expect(ExtractorInvokeSpy).toHaveBeenCalledTimes(1 + 1 + subDirs.length);
    expect(output.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Self contained `.d.ts` rollup guard
// ─────────────────────────────────────────────────────────────────────────────

describe('GenerateApi Executor – self contained rollup guard', () => {
  const selfContainedRollup = `export declare const Foo: number;\nexport { }\n`;
  const brokenRollup = `export declare const Foo: import('./types').Foo;\nexport { }\n`;

  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {
      /* silence expected error output */
    });
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  /**
   * Creates a package fixture whose primary api-extractor config emits explicit rollup variants, plus an
   * optional `./utils` export subpath entry.
   */
  function prepareRollupFixture(config: {
    dtsRollup: Record<string, unknown>;
    namedExport?: string;
    rollupContents: Record<string, string>;
  }) {
    const { paths, context } = prepareFixture('valid', {});
    const { projRoot } = paths;

    const exports: Record<string, unknown> = {
      '.': { types: './dist/index.d.ts', import: './lib/index.js' },
    };
    if (config.namedExport) {
      exports[`./${config.namedExport}`] = {
        types: `./dist/${config.namedExport}/index.d.ts`,
        import: `./lib/${config.namedExport}/index.js`,
      };
    }

    writeFileSync(
      join(projRoot, 'package.json'),
      serializeJson({ name: '@proj/proj', types: 'dist/index.d.ts', exports }),
      'utf-8',
    );

    writeFileSync(
      join(projRoot, 'config', 'api-extractor.json'),
      serializeJson({
        mainEntryPointFilePath: '../dts/src/index.d.ts',
        apiReport: { enabled: false },
        docModel: { enabled: false },
        dtsRollup: { enabled: true, ...config.dtsRollup },
        tsdocMetadata: { enabled: false },
      }),
      'utf-8',
    );

    execSyncMock.mockImplementation(() => {
      mkdirSync(join(projRoot, 'dts', 'src'), { recursive: true });
      writeFileSync(join(projRoot, 'dts', 'src', 'index.d.ts'), 'export const root: 1;', 'utf-8');
      if (config.namedExport) {
        mkdirSync(join(projRoot, 'dts', 'src', config.namedExport), { recursive: true });
        writeFileSync(join(projRoot, 'dts', 'src', config.namedExport, 'index.d.ts'), 'export const util: 1;', 'utf-8');
      }
    });

    // api-extractor is mocked, so emit the rollups it would have written
    jest.spyOn(Extractor, 'invoke').mockImplementation(() => {
      for (const [relativePath, contents] of Object.entries(config.rollupContents)) {
        const filePath = join(projRoot, relativePath);
        mkdirSync(join(filePath, '..'), { recursive: true });
        writeFileSync(filePath, contents, 'utf-8');
      }
      return { succeeded: true } as ExtractorResult;
    });

    return { paths, context };
  }

  it('fails when the untrimmed rollup imports an unpublished relative module', async () => {
    const { context } = prepareRollupFixture({
      dtsRollup: { untrimmedFilePath: '<projectFolder>/dist/index.d.ts' },
      rollupContents: { 'dist/index.d.ts': brokenRollup },
    });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
    expect(loggerErrorSpy.mock.calls.flat().join('\n')).toEqual(
      expect.stringContaining('api-extractor | BROKEN TYPE DECLARATION ROLLUP'),
    );
    expect(loggerErrorSpy.mock.calls.flat().join('\n')).toEqual(expect.stringContaining('- ./types'));
  });

  it('fails when a trimmed rollup variant imports an unpublished relative module', async () => {
    const { context } = prepareRollupFixture({
      dtsRollup: {
        untrimmedFilePath: '<projectFolder>/dist/index.d.ts',
        publicTrimmedFilePath: '<projectFolder>/dist/index.public.d.ts',
      },
      rollupContents: {
        'dist/index.d.ts': selfContainedRollup,
        'dist/index.public.d.ts': brokenRollup,
      },
    });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
    expect(loggerErrorSpy.mock.calls.flat().join('\n')).toEqual(
      expect.stringContaining(join('dist', 'index.public.d.ts') + ' imports modules that are not published'),
    );
  });

  it('fails when an export subpath rollup imports an unpublished relative module', async () => {
    const { context } = prepareRollupFixture({
      dtsRollup: { untrimmedFilePath: '<projectFolder>/dist/index.d.ts' },
      namedExport: 'utils',
      rollupContents: {
        'dist/index.d.ts': selfContainedRollup,
        'dist/utils/index.d.ts': brokenRollup,
      },
    });

    const output = await executor({ ...options, exportSubpaths: true }, context);

    expect(output.success).toBe(false);
    expect(loggerErrorSpy.mock.calls.flat().join('\n')).toEqual(
      expect.stringContaining(join('dist', 'utils', 'index.d.ts') + ' imports modules that are not published'),
    );
  });

  it('succeeds when every generated rollup variant is self contained', async () => {
    const { context } = prepareRollupFixture({
      dtsRollup: {
        untrimmedFilePath: '<projectFolder>/dist/index.d.ts',
        publicTrimmedFilePath: '<projectFolder>/dist/index.public.d.ts',
        betaTrimmedFilePath: '<projectFolder>/dist/index.beta.d.ts',
      },
      namedExport: 'utils',
      rollupContents: {
        'dist/index.d.ts': selfContainedRollup,
        'dist/index.public.d.ts': selfContainedRollup,
        'dist/index.beta.d.ts': selfContainedRollup,
        'dist/utils/index.d.ts': selfContainedRollup,
      },
    });

    const output = await executor({ ...options, exportSubpaths: true }, context);

    expect(loggerErrorSpy).not.toHaveBeenCalled();
    expect(output.success).toBe(true);
  });

  it('surfaces api-extractor diagnostics and skips the rollup guard when extraction fails', async () => {
    const { context } = prepareRollupFixture({
      dtsRollup: { untrimmedFilePath: '<projectFolder>/dist/index.d.ts' },
      rollupContents: { 'dist/index.d.ts': brokenRollup },
    });

    jest.spyOn(Extractor, 'invoke').mockImplementation(() => {
      return { succeeded: false, errorCount: 2, warningCount: 1 } as ExtractorResult;
    });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
    expect(loggerErrorSpy).toHaveBeenCalledWith('API Extractor completed with 2 errors and 1 warnings');
    expect(loggerErrorSpy.mock.calls.flat().join('\n')).not.toEqual(
      expect.stringContaining('BROKEN TYPE DECLARATION ROLLUP'),
    );
  });
});
