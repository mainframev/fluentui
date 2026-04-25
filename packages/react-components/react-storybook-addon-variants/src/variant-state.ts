import type { VariantConfig, VariantsParameter } from './public-types';

export function getVariantKeys(params: VariantsParameter): string[] {
  return Object.keys(params);
}

export function getDefaultVariantKey(params: VariantsParameter): string {
  return Object.keys(params)[0];
}

export function getVariantConfig(params: VariantsParameter, variantKey: string): VariantConfig | undefined {
  return params[variantKey];
}

export function getDefaultFileName(config: VariantConfig): string | undefined {
  return config.files[0]?.name;
}
