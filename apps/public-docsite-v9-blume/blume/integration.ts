import { readFileSync } from 'node:fs';
import type { AstroIntegration } from 'astro';
import { storyVite } from './story-config';

/**
 * Wires the shared story pipeline (aliases, source extraction, island adapters) into the Astro
 * project Blume generates, plus two guarded patches of Blume's own runtime.
 */
export function fluentIntegration(): AstroIntegration {
  return {
    name: 'fluentui:stories',
    hooks: {
      'astro:config:setup': ({ updateConfig, command }) => {
        const vite = storyVite();
        vite.plugins.push({
          name: 'fluentui:preserve-island-code-blocks',
          enforce: 'pre',
          load(id: string) {
            if (!id.endsWith('/blume/src/components/layout/RootLayout.astro')) {
              return;
            }
            const code = readFileSync(id, 'utf8');
            const selector = 'document.querySelectorAll(".prose pre")';
            if (!code.includes(selector)) {
              throw new Error('Blume code-block enhancement changed; review the island isolation adapter.');
            }
            // Blume adds copy buttons to every <pre> in prose; a <pre> rendered by a React island
            // belongs to React, and mutating it breaks hydration.
            return code.replace(selector, 'document.querySelectorAll(".prose pre:not(astro-island pre)")');
          },
        } as never);
        updateConfig({
          vite: {
            ...vite,
            // The prerender environment must bundle dependencies so Yarn-hoisted copies cannot
            // shadow the versions their importers expect.
            ...(command === 'build' ? { environments: { prerender: { resolve: { noExternal: true } } } } : {}),
          } as never,
        });
      },
    },
  };
}
