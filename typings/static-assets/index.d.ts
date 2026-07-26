/**
 * Global ambient declaration of various non javascript assets being imported into JS/TS
 */

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.md' {
  const src: string;
  export default src;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Plain stylesheets are only ever imported for their side effects; the bundler injects them.
 * Declared so `noUncheckedSideEffectImports` (default since TypeScript 6) can resolve them.
 *
 * The empty module body is intentional: a shorthand ambient module (`declare module '*.css';` with no
 * body) makes every export `any`, so a value/default/named import from a plain stylesheet would silently
 * type-check. An explicit empty body still allows `import './foo.css';` for its side effect, but a
 * value/default/named import fails to compile because the module declares no exports.
 */
declare module '*.css' {}
