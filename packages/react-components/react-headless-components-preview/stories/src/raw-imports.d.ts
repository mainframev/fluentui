/**
 * Webpack `?raw` resource queries return a string. Declared here so story
 * files can `import source from './foo.tsx?raw'` without `// @ts-expect-error`
 * suppressions.
 */
declare module '*?raw' {
  const src: string;
  export default src;
}

declare module '*.module.css?raw' {
  const src: string;
  export default src;
}
