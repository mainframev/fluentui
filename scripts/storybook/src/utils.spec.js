/* eslint-disable no-shadow */
const fs = require('fs');
const path = require('path');

const { getAllPackageInfo } = require('@fluentui/scripts-monorepo');
const { stripIndents, workspaceRoot } = require('@nx/devkit');
const semver = require('semver');
const tmp = require('tmp');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

const {
  loadWorkspaceAddon,
  getPackageStoriesGlob,
  getImportMappingsForExportToSandboxAddon,
  processBabelLoaderOptions,
  registerTsPaths,
} = require('./utils');

tmp.setGracefulCleanup();

describe(`utils`, () => {
  describe(`#loadWorkspacePlugin`, () => {
    /**
     *
     * @param {{packageName:string, presetContent?: string}} options
     */
    function setup(options) {
      const npmScope = 'proj';
      const { name: rootDir } = tmp.dirSync({ prefix: 'sb-utils', unsafeCleanup: true });
      const packageRootPath = path.join('packages', options.packageName);
      const packageRootAbsolutePath = path.join(rootDir, packageRootPath);
      const paths = {
        nxJsonPath: path.join(rootDir, 'nx.json'),
        projectJsonPath: path.join(packageRootAbsolutePath, 'project.json'),
        rootTsconfigPath: path.join(rootDir, 'tsconfig.base.json'),
        packageJson: path.join(packageRootAbsolutePath, 'package.json'),
        preset: path.join(packageRootAbsolutePath, 'preset.js'),
      };

      // setup project
      fs.writeFileSync(paths.nxJsonPath, JSON.stringify({ npmScope: 'proj' }, null, 2), 'utf-8');
      fs.mkdirSync(packageRootAbsolutePath, { recursive: true });
      fs.writeFileSync(
        paths.projectJsonPath,
        JSON.stringify(
          {
            name: options.packageName,
            root: packageRootPath,
            sourceRoot: path.join(packageRootPath, 'src'),
          },
          null,
          2,
        ),
        'utf-8',
      );
      fs.writeFileSync(
        paths.rootTsconfigPath,
        JSON.stringify({
          compilerOptions: { baseUrl: '.', paths: { [`@${npmScope}/one`]: ['packages/one/src/index.ts'] } },
        }),
      );

      fs.mkdirSync(packageRootAbsolutePath, { recursive: true });
      fs.writeFileSync(
        paths.packageJson,
        JSON.stringify(
          {
            module: './lib/index.js',
          },
          null,
          2,
        ),
        'utf-8',
      );

      const presetTemplate =
        options.presetContent ??
        stripIndents`
          const preset = require('./lib-commonjs/preset/preset');

          function config(entry = []) {
            return [...entry, require.resolve('./lib/preset/preview')];
          }

          function managerEntries(entry = []) {
            return [...entry, require.resolve('./lib/preset/manager')];
          }

          module.exports = { managerEntries, config, ...preset };
      `;

      fs.writeFileSync(paths.preset, presetTemplate, 'utf-8');

      return {
        npmScope,
        workspaceRoot: rootDir,
        tsConfigRoot: paths.rootTsconfigPath,
        packageRoot: packageRootAbsolutePath,
      };
    }

    it(`should return path to in memory preset loader root`, () => {
      const { npmScope, workspaceRoot, tsConfigRoot } = setup({ packageName: 'storybook-custom-addon' });

      const actual = loadWorkspaceAddon(`@${npmScope}/storybook-custom-addon`, {
        workspaceRoot,
        npmScope,
        tsConfigPath: tsConfigRoot,
      });
      const expected = `${workspaceRoot}/packages/storybook-custom-addon/temp/preset.ts`;

      expect(actual).toBe(expected);
    });

    it(`should return path to in memory preset loader root with options if provided `, () => {
      const { npmScope, workspaceRoot, tsConfigRoot } = setup({ packageName: 'storybook-custom-addon' });

      const actual = loadWorkspaceAddon(`@${npmScope}/storybook-custom-addon`, {
        workspaceRoot,
        npmScope,
        tsConfigPath: tsConfigRoot,
        options: { who: 'developers' },
      });
      const expected = {
        name: `${workspaceRoot}/packages/storybook-custom-addon/temp/preset.ts`,
        options: { who: 'developers' },
      };

      expect(actual).toEqual(expected);
    });

    it(`should create mocked preset registration module with in memory TS compilation`, () => {
      const { tsConfigRoot, npmScope, packageRoot, workspaceRoot } = setup({ packageName: 'storybook-custom-addon' });

      loadWorkspaceAddon(`@${npmScope}/storybook-custom-addon`, {
        workspaceRoot,
        npmScope,
        tsConfigPath: tsConfigRoot,
      });

      const mockedPreset = fs.readFileSync(path.join(packageRoot, 'temp', 'preset.ts'), 'utf-8');

      expect(mockedPreset.replace(tsConfigRoot, 'Any<String>')).toMatchInlineSnapshot(`
        "// @ts-nocheck

        const { registerTsPaths } = require('@fluentui/scripts-storybook');

        function managerWebpack(config, options) {
        registerTsPaths({config, configFile: 'Any<String>'});
        return config;
        }

        const preset = require('../src/preset/preset');

        function config(entry = []) {
        return [...entry, require.resolve('../src/preset/preview.ts')];
        }

        function managerEntries(entry = []) {
        return [...entry, require.resolve('../src/preset/manager.ts')];
        }

        module.exports = { managerWebpack, managerEntries, config, ...preset };"
      `);
    });

    it(`should create mocked preset registration module with in memory TS compilation if webpack preset is part of api`, () => {
      const { tsConfigRoot, npmScope, packageRoot, workspaceRoot } = setup({
        packageName: 'storybook-custom-addon',

        presetContent: stripIndents`
          const preset = require('./lib/preset/preset');

          function config(entry = []) {
            return [...entry, require.resolve('./lib/preset/preview')];
          }

          function managerEntries(entry = []) {
            return [...entry, require.resolve('./lib/preset/manager')];
          }

          module.exports = { managerEntries, config, ...preset };
      `,
      });

      loadWorkspaceAddon(`@${npmScope}/storybook-custom-addon`, {
        workspaceRoot,
        npmScope,
        tsConfigPath: tsConfigRoot,
      });

      const mockedPreset = fs.readFileSync(path.join(packageRoot, 'temp', 'preset.ts'), 'utf-8');

      expect(mockedPreset.replace(tsConfigRoot, 'Any<String>')).toMatchInlineSnapshot(`
        "// @ts-nocheck

        function registerInMemoryTsTranspilation(){
        const { registerTsProject } = require('@nx/js/src/internal');
        const { joinPathFragments } = require('@nx/devkit');
        registerTsProject(joinPathFragments(__dirname, '..', 'tsconfig.lib.json'));
        }

        registerInMemoryTsTranspilation();

        const { registerTsPaths } = require('@fluentui/scripts-storybook');

        function managerWebpack(config, options) {
        registerTsPaths({config, configFile: 'Any<String>'});
        return config;
        }

        const preset = require('../src/preset/preset');

        function config(entry = []) {
        return [...entry, require.resolve('../src/preset/preview.ts')];
        }

        function managerEntries(entry = []) {
        return [...entry, require.resolve('../src/preset/manager.ts')];
        }

        module.exports = { managerWebpack, managerEntries, config, ...preset };"
      `);
    });
  });

  describe(`#registerTsPaths`, () => {
    /**
     * `TsconfigPathsPlugin`'s constructor eagerly reads `configFile` off disk, so a real fixture is
     * required (an arbitrary/non-existent path throws synchronously before any of the assertions here
     * are reached).
     * @param {{compilerOptions?: Record<string, unknown>}} [overrides]
     */
    function writeTsConfigFixture(overrides = {}) {
      const { name: rootDir } = tmp.dirSync({ prefix: 'sb-utils-register-ts-paths', unsafeCleanup: true });
      const tsConfigPath = path.join(rootDir, 'tsconfig.json');
      fs.writeFileSync(
        tsConfigPath,
        JSON.stringify({ compilerOptions: { paths: { '@proj/*': ['./src/*'] }, ...overrides.compilerOptions } }),
        'utf-8',
      );
      return tsConfigPath;
    }

    /**
     * `registerTsPaths` always sets `config.resolve.plugins`, but `Configuration['resolve']['plugins']`
     * is typed as optional - this narrows that away for the assertions below instead of repeating an
     * unsafe optional chain (`?.`) at every call site.
     * @param {import('webpack').Configuration} config
     */
    function getRegisteredPlugins(config) {
      if (!config.resolve || !config.resolve.plugins) {
        throw new Error('expected registerTsPaths to have set config.resolve.plugins');
      }
      return config.resolve.plugins;
    }

    it(`registers a single TsconfigPathsPlugin instance on the webpack config`, () => {
      const configFile = writeTsConfigFixture();
      /** @type {import('webpack').Configuration} */
      const config = {};

      registerTsPaths({ config, configFile });

      const plugins = getRegisteredPlugins(config);
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBeInstanceOf(TsconfigPathsPlugin);
      expect(/** @type {TsconfigPathsPlugin} */ (plugins[0]).baseUrl).toBeUndefined();
    });

    it(`threads an explicit baseUrl through to TsconfigPathsPlugin, backward compatibly (no baseUrl -> plugin's own fallback)`, () => {
      const configFile = writeTsConfigFixture();
      /** @type {import('webpack').Configuration} */
      const config = {};

      registerTsPaths({
        config,
        configFile,
        baseUrl: '/workspace',
      });

      const plugin = /** @type {TsconfigPathsPlugin} */ (getRegisteredPlugins(config)[0]);
      expect(plugin.baseUrl).toBe('/workspace');
    });

    it(`replaces a previously registered TsconfigPathsPlugin instead of stacking a second one`, () => {
      const configFile = writeTsConfigFixture();
      /** @type {import('webpack').Configuration} */
      const config = {};

      registerTsPaths({ config, configFile });
      registerTsPaths({ config, configFile, baseUrl: '/workspace' });

      const plugins = getRegisteredPlugins(config);
      expect(plugins).toHaveLength(1);
      expect(/** @type {TsconfigPathsPlugin} */ (plugins[0]).baseUrl).toBe('/workspace');
    });
  });

  describe(`#getPackageStoriesGlob`, () => {
    it(`should generate storybook stories string array of glob based on package.json#dependencies field`, () => {
      const actual = getPackageStoriesGlob({
        packageName: '@fluentui/react-components',
        callerPath: path.dirname(__dirname),
      });

      const expected = [
        expect.stringContaining('../../packages/react-'),
        expect.stringContaining('/**/@(index.stories.@(ts|tsx)|*.mdx)'),
      ];

      expect(actual).toEqual(expect.arrayContaining(expected));

      const first = actual[0];
      expect(first.startsWith('../../packages/react-')).toBeTruthy();

      expect(first.endsWith('**/@(index.stories.@(ts|tsx)|*.mdx)')).toBeTruthy();
    });

    it(`should generate storybook stories string array of glob based on package.json#dependencies field without packages specified within 'excludeStoriesInsertionFromPackages'`, () => {
      const actual = getPackageStoriesGlob({
        packageName: '@fluentui/react-components',
        callerPath: path.dirname(__dirname),
        // should support both project and package names
        excludeStoriesInsertionFromPackages: ['@fluentui/react-text', 'react-button'],
      });

      expect(actual).not.toContainEqual(expect.stringContaining('/react-button/stories/'));
      expect(actual).not.toContainEqual(expect.stringContaining('/react-text/stories/'));
    });

    it(`should generate storybook stories string array of glob based on package.json#dependencies field pointing to sibling /stories project if it exists`, () => {
      const actual = getPackageStoriesGlob({
        packageName: '@fluentui/react-menu',
        callerPath: path.dirname(__dirname),
      });

      const expected = [
        expect.stringContaining('../../packages/react-'),
        expect.stringContaining('/**/@(index.stories.@(ts|tsx)|*.mdx)'),
      ];

      expect(actual).toEqual(expect.arrayContaining(expected));

      // package without any stories
      expect(actual).toContain('../../packages/react-components/keyboard-keys/src/**/@(index.stories.@(ts|tsx)|*.mdx)');
      // package with stories ( `*-stories` project adjacent project )
      expect(actual).toContain(
        '../../packages/react-components/react-theme/stories/src/**/@(index.stories.@(ts|tsx)|*.mdx)',
      );
    });
  });

  describe(`#processBabelLoaderOptions`, () => {
    it(`should add customize property with loader`, () => {
      const actual = processBabelLoaderOptions({ plugins: [['foo-babel-loader', { one: true }]] });

      expect(actual).toEqual({
        customize: `${workspaceRoot}/scripts/storybook/src/loaders/custom-loader.js`,
        plugins: [
          [
            'foo-babel-loader',
            {
              one: true,
            },
          ],
        ],
      });
    });
  });

  describe(`#getImportMappingsForExportToSandboxAddon`, () => {
    it(`should get import mappings for storybook sources`, () => {
      const allPackagesInfo = getAllPackageInfo();
      const allPackagesInfoProjects = Object.values(allPackagesInfo);
      const suitePackage = allPackagesInfo['@fluentui/react-components'];
      const suitePackageDependencies = suitePackage.packageJson.dependencies ?? {};
      const unstablePackage = allPackagesInfoProjects.find(metadata => {
        return (
          suitePackageDependencies[metadata.packageJson.name] &&
          semver.prerelease(metadata.packageJson.version) !== null
        );
      });
      const stableSuitePackages = allPackagesInfoProjects.reduce((acc, metadata) => {
        if (
          suitePackageDependencies[metadata.packageJson.name] &&
          semver.prerelease(metadata.packageJson.version) === null
        ) {
          acc[metadata.packageJson.name] = { replace: '@fluentui/react-components' };
        }
        return acc;
      }, /** @type {Record<string, { replace: string }>} */ ({}));

      const actual = getImportMappingsForExportToSandboxAddon();

      expect(actual).toEqual(
        expect.objectContaining({
          ...stableSuitePackages,
          ...(unstablePackage
            ? { [unstablePackage.packageJson.name]: { replace: '@fluentui/react-components/unstable' } }
            : null),
        }),
      );
    });
  });
});
