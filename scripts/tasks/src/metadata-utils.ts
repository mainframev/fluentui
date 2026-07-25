import * as fs from 'node:fs';
import * as path from 'node:path';

import { isConvergedPackage, workspaceRoot } from '@fluentui/scripts-monorepo';
import * as glob from 'glob';

export function getRawMetadata(projectRoot: string) {
  const root = path.resolve(workspaceRoot, projectRoot);
  const packageJsonPath = path.join(root, 'package.json');
  const projectJsonPath = path.join(root, 'project.json');

  const project: import('@nx/devkit').ProjectConfiguration = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
  const packageJson: import('nx/src/utils/package-json').PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf-8'),
  );

  const metadata = { project, packageJson };

  const isConverged = () => isConvergedPackage(metadata);

  function shipsAMD() {
    if (project.projectType !== 'library') {
      return false;
    }

    const tags = new Set(project.tags ?? []);

    const isV8 = tags.has('v8');
    const isV9 = tags.has('vNext');
    const needsAMD = tags.has('ships-amd');
    const isMixedProject = isV9 && isV8;

    if (needsAMD) {
      return true;
    }
    if (isMixedProject) {
      return true;
    }
    if (isV9) {
      return false;
    }
    return true;
  }

  /**
   * Whether the published `lib`/`lib-commonjs` JavaScript of this project is on the ES5 baseline.
   *
   * TypeScript 6 removed `target: 'es5'`, so the ES5 emit moved from `tsc` to a SWC downlevel step
   * (`ts:downlevel`). Which projects are on that baseline cannot be derived from other metadata
   * (`shipsAMD()`, tags, versions, ...) - eg `@fluentui/react-icons-mdl2` ships AMD but its
   * `lib`/`lib-commonjs` were emitted as ES2019 - so it is opt-in project metadata: every project
   * whose tsconfig declared `target: es5` before the TypeScript 6 migration carries the
   * `ships-es5` tag.
   *
   * @see https://github.com/microsoft/fluentui/issues/36409
   */
  function shipsES5() {
    return new Set(project.tags ?? []).has('ships-es5');
  }

  function hasJest() {
    return fs.existsSync(path.join(projectRoot, 'jest.config.js'));
  }
  function hasBabel() {
    return fs.existsSync(path.join(projectRoot, '.babelrc.json'));
  }
  function hasWebpack() {
    return fs.existsSync(path.join(projectRoot, 'webpack.config.js'));
  }
  function hasSass() {
    return glob.sync(path.join(projectRoot, 'src/**/*.scss')).length > 0;
  }

  return { ...metadata, isConverged, shipsAMD, shipsES5, hasJest, hasBabel, hasSass, hasWebpack };
}
