export type StyleVariant = 'tailwind' | 'css';

export const STYLE_VARIANT_STORAGE_KEY = 'fluentui-headless-style-variant';
export const STYLE_VARIANT_ARG = '__styleVariant';

export const readStoredVariant = (): StyleVariant => {
  if (typeof window === 'undefined') return 'tailwind';
  return window.localStorage.getItem(STYLE_VARIANT_STORAGE_KEY) === 'css' ? 'css' : 'tailwind';
};

export const storeVariant = (v: StyleVariant) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STYLE_VARIANT_STORAGE_KEY, v);
};
