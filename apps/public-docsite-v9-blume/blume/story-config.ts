import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { fullSource } from '../vite-plugins/full-source';
import { markdownAsString } from '../vite-plugins/markdown-as-string';
import { scopeStoryGlobals } from '../vite-plugins/scope-story-globals';
import { storyOrder } from '../vite-plugins/story-order';
import { tsconfigAliases } from '../vite-plugins/tsconfig-aliases';

const require = createRequire(import.meta.url);
export const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
export const headlessTokensCss = `${repoRoot}packages/react-components/react-headless-components-preview/stories/.storybook/tokens.css`;
const { getImportMappingsForExportToSandboxAddon } = require('@fluentui/scripts-storybook');

/** Pin every `react` / `react-dom` specifier to the workspace copy: Blume nests its own React 19.3. */
export function reactAliases() {
  const dir = (name: string) => `${repoRoot}node_modules/${name}/`;
  return [
    { find: /^react$/, replacement: require.resolve('react') },
    { find: /^react\/(.*)$/, replacement: `${dir('react')}$1` },
    { find: /^react-dom$/, replacement: require.resolve('react-dom') },
    { find: /^react-dom\/(.*)$/, replacement: `${dir('react-dom')}$1` },
  ];
}

/**
 * Guarded source transforms that only make sense when several independently hydrating islands
 * share one document. Each asserts the upstream text it patches so a dependency bump fails loudly.
 */
export function islandAdapters() {
  return [
    {
      name: 'fluentui:island-tabster-attributes',
      enforce: 'pre' as const,
      transform(code: string, id: string) {
        if (!id.endsWith('/react-tabster/src/hooks/useTabsterAttributes.ts')) {
          return;
        }
        const target = 'const strAttr = getTabsterAttribute(props, true);';
        if (!code.includes(target)) {
          throw new Error('Tabster attribute implementation changed; review the island hydration adapter.');
        }
        // A hydrated island's Tabster instance must not mutate its not-yet-hydrated siblings.
        return `import { useIsSSR } from '@fluentui/react-utilities';\n${code.replace(
          target,
          'const isSSR = useIsSSR();\n  const strAttr = isSSR ? undefined : getTabsterAttribute(props, true);',
        )}`;
      },
    },
    {
      name: 'fluentui:hydrate-portals',
      enforce: 'pre' as const,
      transform(code: string, id: string) {
        if (!id.endsWith('/react-portal/library/src/components/Portal/usePortalMountNode.ts')) {
          return;
        }
        const target = 'targetNode: mountNode ?? targetDocument?.body,';
        if (!code.includes(target)) {
          throw new Error('Portal mount implementation changed; review the hydration adapter.');
        }
        return `import { useIsSSR } from '@fluentui/react-utilities';\n${code
          .replace(
            '  const mountNode = usePortalMountNodeContext();',
            '  const mountNode = usePortalMountNodeContext();\n  const isSSR = useIsSSR();',
          )
          .replace(target, 'targetNode: isSSR ? undefined : mountNode ?? targetDocument?.body,')}`;
      },
    },
  ];
}

/**
 * Vite configuration shared by the content generator and the Astro build. The generator's SSR
 * module runner must keep React external (`pinReact: false`): absolute aliases would make it
 * evaluate CommonJS React as ESM (`module is not defined`).
 */
export function storyVite(pinReact = true) {
  return {
    resolve: {
      alias: [
        { find: /^@repo\/(.*)$/, replacement: `${repoRoot}$1` },
        ...tsconfigAliases(`${repoRoot}tsconfig.base.json`, repoRoot),
        ...(pinReact ? reactAliases() : []),
      ],
      dedupe: ['react', 'react-dom', '@griffel/react'],
    },
    ssr: { noExternal: [/^@fluentui\//, 'tabster', 'keyborg'] },
    plugins: [
      ...islandAdapters(),
      markdownAsString(),
      scopeStoryGlobals(),
      storyOrder(),
      fullSource({
        importMappings: getImportMappingsForExportToSandboxAddon(),
        cssModules: { tokensFilePath: headlessTokensCss },
      }),
    ],
  };
}
