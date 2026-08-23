import { execSync } from 'child_process';

import { series } from 'just-scripts';

import { apiExtractor } from './api-extractor';
import { createTsConfigWithoutPathAliases, getTsPathAliasesConfigUsedOnlyForDx } from './utils';

export function generateApi() {
  return series(generateTypeDeclarations, apiExtractor);
}

function generateTypeDeclarations() {
  const { tsConfigFileForCompilation } = getTsPathAliasesConfigUsedOnlyForDx();
  // turn off path aliases.
  const noPathAliasesConfig = createTsConfigWithoutPathAliases(tsConfigFileForCompilation, 'generate-api');
  const cmd = ['tsc', `-p ./${noPathAliasesConfig.path}`, '--emitDeclarationOnly'].filter(Boolean).join(' ');

  try {
    return execSync(cmd, { stdio: 'inherit' });
  } finally {
    noPathAliasesConfig.cleanup();
  }
}
