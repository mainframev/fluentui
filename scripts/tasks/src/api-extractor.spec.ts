import type { ExtractorResult } from '@microsoft/api-extractor';
import type { ApiExtractorOptions } from 'just-scripts';
import { logger } from 'just-scripts';

import { apiExtractor } from './api-extractor';
import { assertSelfContainedDtsRollups } from './dts-rollup';

/**
 * `just-scripts` vendors its own `ExtractorMessage` declaration (distinct from - and nominally
 * incompatible with - `@microsoft/api-extractor`'s), so `messageCallback`'s parameter type has to be
 * derived from `ApiExtractorOptions` itself rather than imported directly.
 */
type CapturedMessage = Parameters<NonNullable<ApiExtractorOptions['messageCallback']>>[0];

/**
 * The subset of {@link ApiExtractorOptions} that `onResult` wiring tests need to invoke directly -
 * `apiExtractorVerifyTask` itself is mocked away, so its callbacks have to be captured and called by hand.
 */
type CapturedApiExtractorOptions = ApiExtractorOptions & {
  onResult: NonNullable<ApiExtractorOptions['onResult']>;
  messageCallback: NonNullable<ApiExtractorOptions['messageCallback']>;
};

const apiExtractorVerifyTaskCalls: CapturedApiExtractorOptions[] = [];

jest.mock('just-scripts', () => {
  const noop = () => undefined;

  return {
    task: jest.fn((_name: string, definition: unknown) => definition),
    series: jest.fn((...tasks: unknown[]) => tasks),
    logger: { info: noop, warn: noop, error: jest.fn(), verbose: noop },
    apiExtractorVerifyTask: jest.fn((options: CapturedApiExtractorOptions) => {
      apiExtractorVerifyTaskCalls.push(options);
      return noop;
    }),
  };
});

jest.mock('glob', () => ({ sync: jest.fn(() => ['/proj/config/api-extractor.json']) }));

jest.mock('./argv', () => ({ getJustArgv: jest.fn(() => ({})) }));

jest.mock('./utils', () => ({
  getTsPathAliasesConfig: jest.fn(() => ({
    isUsingTsSolutionConfigs: true,
    packageJson: { name: '@fluentui/react-theme' },
    tsConfigs: {},
  })),
  getTsPathAliasesApiExtractorConfig: jest.fn(),
}));

jest.mock('./dts-rollup', () => ({ assertSelfContainedDtsRollups: jest.fn() }));

const assertSelfContainedDtsRollupsMockFn = assertSelfContainedDtsRollups as jest.MockedFunction<
  typeof assertSelfContainedDtsRollups
>;
const loggerErrorMockFn = logger.error as jest.MockedFunction<typeof logger.error>;

function getCapturedOnResult() {
  expect(apiExtractorVerifyTaskCalls).toHaveLength(1);
  return apiExtractorVerifyTaskCalls[0];
}

/**
 * `onResult` wiring must match the vNext `generate-api` executor (`tools/workspace-plugin/src/executors/generate-api/executor.ts`):
 * the rollup guard is a self contained `.d.ts` rollup check, a different class of problem than API
 * Extractor's own diagnostics, and it must never mask (or be masked by) those diagnostics.
 */
describe(`apiExtractor onResult wiring`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiExtractorVerifyTaskCalls.length = 0;
  });

  it(`does not run the self contained rollup guard when API Extractor failed`, () => {
    apiExtractor();
    const { onResult } = getCapturedOnResult();
    const fakeExtractorConfig = { projectFolder: '/proj' } as unknown as ExtractorResult['extractorConfig'];

    onResult({ succeeded: false, extractorConfig: fakeExtractorConfig } as ExtractorResult, {} as never);

    expect(assertSelfContainedDtsRollupsMockFn).not.toHaveBeenCalled();
  });

  it(`surfaces missing dependency type declarations before skipping the rollup guard on failure`, () => {
    apiExtractor();
    const { onResult, messageCallback } = getCapturedOnResult();
    const fakeExtractorConfig = { projectFolder: '/proj' } as unknown as ExtractorResult['extractorConfig'];

    messageCallback({
      category: 'Compiler',
      messageId: 'TS7016',
      text: `Could not find a declaration file for module '@fluentui/react-theme'`,
    } as CapturedMessage);

    onResult({ succeeded: false, extractorConfig: fakeExtractorConfig } as ExtractorResult, {} as never);

    expect(loggerErrorMockFn).toHaveBeenCalledWith(
      expect.stringContaining('MISSING DEPENDENCY TYPE DECLARATIONS'),
      expect.stringContaining('@fluentui/react-theme'),
      '\n',
      expect.stringContaining('generate-api'),
      '\n',
    );
    expect(assertSelfContainedDtsRollupsMockFn).not.toHaveBeenCalled();
  });

  it(`runs the self contained rollup guard once API Extractor succeeded`, () => {
    apiExtractor();
    const { onResult } = getCapturedOnResult();
    const fakeExtractorConfig = { projectFolder: '/proj' } as unknown as ExtractorResult['extractorConfig'];

    onResult({ succeeded: true, extractorConfig: fakeExtractorConfig } as ExtractorResult, {} as never);

    expect(assertSelfContainedDtsRollupsMockFn).toHaveBeenCalledTimes(1);
    expect(assertSelfContainedDtsRollupsMockFn).toHaveBeenCalledWith(fakeExtractorConfig, {
      scannedFilePaths: expect.any(Set),
    });
  });

  it(`shares scannedFilePaths across every config executed within the same run`, () => {
    // two `config/api-extractor*.json` files -> two entry point configs executed by one `apiExtractor()` call
    jest
      .requireMock('glob')
      .sync.mockReturnValueOnce(['/proj/config/api-extractor.json', '/proj/config/api-extractor.fast.json']);

    apiExtractor();

    expect(apiExtractorVerifyTaskCalls).toHaveLength(2);

    const fakeExtractorConfig = { projectFolder: '/proj' } as unknown as ExtractorResult['extractorConfig'];
    apiExtractorVerifyTaskCalls[0].onResult(
      { succeeded: true, extractorConfig: fakeExtractorConfig } as ExtractorResult,
      {} as never,
    );
    apiExtractorVerifyTaskCalls[1].onResult(
      { succeeded: true, extractorConfig: fakeExtractorConfig } as ExtractorResult,
      {} as never,
    );

    expect(assertSelfContainedDtsRollupsMockFn).toHaveBeenCalledTimes(2);
    const [firstCallScannedFilePaths] = assertSelfContainedDtsRollupsMockFn.mock.calls[0].slice(1) as [
      { scannedFilePaths: Set<string> },
    ];
    const [secondCallScannedFilePaths] = assertSelfContainedDtsRollupsMockFn.mock.calls[1].slice(1) as [
      { scannedFilePaths: Set<string> },
    ];

    expect(firstCallScannedFilePaths.scannedFilePaths).toBe(secondCallScannedFilePaths.scannedFilePaths);
  });
});
