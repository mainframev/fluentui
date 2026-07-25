import { getJustArgv } from './argv';
import { getRawMetadata } from './metadata-utils';
import { preset } from './presets';

type TaskDefinition =
  | string
  | { type: 'series' | 'parallel'; tasks: TaskDefinition[] }
  | ConditionDefinition
  | Function;
interface ConditionDefinition {
  type: 'condition';
  task: TaskDefinition;
  isEnabled: () => boolean;
}

jest.mock('just-scripts', () => {
  const noop = () => undefined;
  const taskRegistry = new Map<string, TaskDefinition>();

  return {
    __taskRegistry: taskRegistry,
    task: jest.fn((name: string, definition: TaskDefinition) => {
      taskRegistry.set(name, definition);
      return { cached: jest.fn() };
    }),
    series: jest.fn((...tasks: TaskDefinition[]) => ({ type: 'series', tasks })),
    parallel: jest.fn((...tasks: TaskDefinition[]) => ({ type: 'parallel', tasks })),
    condition: jest.fn((task: TaskDefinition, isEnabled: () => boolean) => ({ type: 'condition', task, isEnabled })),
    option: jest.fn(),
    addResolvePath: jest.fn(),
    logger: { info: noop, warn: noop, error: noop, verbose: noop },
    argv: jest.fn(() => ({})),
    cleanTask: jest.fn(() => noop),
    copyTask: jest.fn(() => noop),
    copyInstructionsTask: jest.fn(() => noop),
    eslintTask: jest.fn(() => noop),
    sassTask: jest.fn(() => noop),
    tscTask: jest.fn(() => noop),
    webpackCliTask: jest.fn(() => noop),
    webpackDevServerTask: jest.fn(() => noop),
    apiExtractorVerifyTask: jest.fn(() => noop),
    resolveCwd: jest.fn((value: string) => value),
  };
});
// storybook is ESM only, it cannot be required within our CJS jest setup
jest.mock('./storybook', () => ({
  startStorybookTask: () => () => undefined,
  buildStorybookTask: () => () => undefined,
}));
// `./jest` declares a `jest` binding, which collides with the global one injected by jest itself
jest.mock('./jest', () => ({ jest: () => undefined, jestWatch: () => undefined }));
jest.mock('./argv', () => ({ getJustArgv: jest.fn(() => ({})) }));
jest.mock('./metadata-utils', () => ({ getRawMetadata: jest.fn() }));

const registry: Map<string, TaskDefinition> = jest.requireMock('just-scripts').__taskRegistry;
const getJustArgvMockFn = getJustArgv as jest.MockedFunction<typeof getJustArgv>;
const getRawMetadataMockFn = getRawMetadata as jest.MockedFunction<typeof getRawMetadata>;

describe(`preset`, () => {
  interface SetupOptions {
    production?: boolean;
    module?: { esm: boolean; cjs: boolean; amd: boolean };
    isConverged?: boolean;
    shipsAMD?: boolean;
    shipsES5?: boolean;
    hasBabel?: boolean;
  }

  function setup(options: SetupOptions = {}) {
    const {
      production = false,
      module: moduleFlag,
      isConverged = false,
      shipsAMD = true,
      shipsES5 = true,
      hasBabel = false,
    } = options;

    registry.clear();
    getJustArgvMockFn.mockReturnValue({ production, ...(moduleFlag ? { module: moduleFlag } : null) });
    getRawMetadataMockFn.mockReturnValue({
      isConverged: () => isConverged,
      shipsAMD: () => shipsAMD,
      shipsES5: () => shipsES5,
      hasBabel: () => hasBabel,
      hasSass: () => false,
      hasWebpack: () => false,
      hasJest: () => false,
      project: { root: '', projectType: 'library' },
      packageJson: { name: '@proj/one', version: '8.0.0' },
    } as unknown as ReturnType<typeof getRawMetadata>);

    preset();
  }

  /**
   * Resolves the (possibly lazy) task definition registered under `taskName` into a serializable tree,
   * where every `condition()` is resolved to `taskName (enabled|disabled)`.
   *
   * NOTE: only the top level definition is invoked (that's how just-scripts defines lazy task graphs).
   * Nested functions are the actual task implementations, thus they are never executed.
   */
  function resolveTask(taskName: string): unknown {
    const definition = registry.get(taskName);

    if (!definition) {
      throw new Error(`"${taskName}" task is not registered`);
    }

    if (typeof definition === 'function') {
      const resolved = (definition as () => TaskDefinition | undefined)();
      return resolved ? resolveDefinition(resolved) : '<inline task>';
    }

    return resolveDefinition(definition);
  }

  function resolveDefinition(definition: TaskDefinition): unknown {
    if (typeof definition === 'string') {
      return definition;
    }

    if (typeof definition === 'function') {
      return '<inline task>';
    }

    if (definition.type === 'condition') {
      const taskName = typeof definition.task === 'string' ? definition.task : '<inline task>';
      return `${taskName} (${definition.isEnabled() ? 'enabled' : 'disabled'})`;
    }

    return { [definition.type]: definition.tasks.map(resolveDefinition) };
  }

  it(`should compile only module formats supported by the compiler`, () => {
    setup({ production: true });

    // `module: amd` was removed in TypeScript 6, thus `tsc` emits ESM + CJS only
    expect(resolveTask('ts:compile')).toEqual({ parallel: ['ts:commonjs', 'ts:esm'] });
  });

  it(`should transpile compiler output after it has been emitted and copied`, () => {
    setup({ production: true });

    expect(resolveTask('ts')).toEqual({
      series: ['ts:compile', 'copy-compiled', 'ts:transpile', 'ts:postprocess', 'babel:postprocess (disabled)'],
    });
  });

  it(`should downlevel and create amd output for v8 production builds`, () => {
    setup({ production: true, shipsAMD: true, shipsES5: true, isConverged: false });

    expect(resolveTask('ts:transpile')).toEqual({
      series: ['ts:downlevel (enabled)', 'ts:amd (enabled)'],
    });
  });

  it(`should not create amd output outside of production builds`, () => {
    setup({ production: false, shipsAMD: true, shipsES5: true, isConverged: false });

    expect(resolveTask('ts:transpile')).toEqual({
      series: ['ts:downlevel (enabled)', 'ts:amd (disabled)'],
    });
  });

  it(`should not downlevel packages which don't ship the legacy artifacts`, () => {
    setup({ production: true, shipsAMD: false, shipsES5: false, isConverged: true });

    expect(resolveTask('ts:transpile')).toEqual({
      series: ['ts:downlevel (disabled)', 'ts:amd (disabled)'],
    });
  });

  /**
   * eg `@fluentui/react-icons-mdl2` ships AMD, but its `lib`/`lib-commonjs` were emitted as ES2019
   * before the TypeScript 6 migration - downleveling them to ES5 would silently change what is published
   */
  it(`should create amd output without downleveling packages which are not on the ES5 baseline`, () => {
    setup({ production: true, shipsAMD: true, shipsES5: false, isConverged: false });

    expect(resolveTask('ts:transpile')).toEqual({
      series: ['ts:downlevel (disabled)', 'ts:amd (enabled)'],
    });
  });

  it(`should honour the --module flag`, () => {
    setup({ production: false, shipsES5: true, module: { esm: true, cjs: false, amd: true } });

    expect(resolveTask('ts:compile')).toEqual({
      parallel: ['ts:commonjs (disabled)', 'ts:esm (enabled)'],
    });
    expect(resolveTask('ts:transpile')).toEqual({
      series: ['ts:downlevel (enabled)', 'ts:amd (enabled)'],
    });
  });

  it(`should postprocess amd output`, () => {
    setup({ production: true });

    expect(resolveTask('ts:amd')).toEqual({ series: ['<inline task>', 'postprocess:amd'] });
  });

  it(`should downlevel node only packages, which don't run the "ts" task`, () => {
    setup({ shipsES5: true });

    expect(resolveTask('build:node-lib')).toEqual({
      series: ['clean', 'copy', 'ts:commonjs', 'ts:downlevel (enabled)'],
    });

    setup({ shipsES5: false });

    expect(resolveTask('build:node-lib')).toEqual({
      series: ['clean', 'copy', 'ts:commonjs', 'ts:downlevel (disabled)'],
    });
  });

  it(`should build v8 packages`, () => {
    setup({ production: true });

    expect(resolveTask('build:react')).toEqual({
      series: [
        'clean',
        'copy',
        'sass',
        'ts',
        'api-extractor',
        'lint-imports:all (enabled)',
        'lint-imports:amd (disabled)',
      ],
    });
  });
});
