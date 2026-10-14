import * as React from 'react';
import { RendererProvider, createDOMRenderer, type GriffelRenderer } from '@griffel/react';
import type { Theme } from '@fluentui/react-components';
import { SSRProvider, type ForwardRefComponent } from '@fluentui/react-utilities';
import { THEMES, isThemeId } from '../src/components/DocsSettings';
import type { ThemeId } from '../src/components/DocsSettings';
import { StoryPreview, PreviewSettingsProvider } from '../src/components/StoryPreview';
import type { StoryDecorator, TextDirection } from '../src/components/StoryPreview';
import { openInStackBlitz } from '../src/utils/sandbox';

export type Story = React.ComponentType<Record<string, unknown>> & {
  args?: Record<string, unknown>;
  parameters?: { fullSource?: string; cssModuleSources?: Record<string, string> };
};

export interface ExampleProps {
  story: Story;
  name: string;
  decorators?: StoryDecorator[];
  headless?: boolean;
  /** Build-time renderer so Griffel rules can be collected into static CSS. */
  renderer?: GriffelRenderer;
}

// Toolbar controls are plain elements on purpose: a FluentProvider per toolbar would add another
// ~12 KB theme stylesheet to every example's server-rendered HTML.
const control: React.CSSProperties = {
  font: 'inherit',
  padding: '2px 8px',
  borderRadius: 4,
  border: '1px solid var(--blume-border, #ccc)',
  background: 'var(--blume-background, #fff)',
  color: 'inherit',
  cursor: 'pointer',
};

const SANDBOX_DEPENDENCIES = {
  requiredDependencies: { react: '^19', 'react-dom': '^19', '@fluentui/react-components': '^9.0.0' },
  optionalDependencies: { '@fluentui/react-icons': 'latest' },
  devDependencies: { '@types/react': '^19', '@types/react-dom': '^19', typescript: '~5.7.0' },
};

/** A single story preview with its own theme and text-direction controls. */
export const Example: ForwardRefComponent<ExampleProps> = React.forwardRef(
  ({ story, name, decorators, headless = false, renderer: suppliedRenderer }, ref) => {
    const [renderer] = React.useState(() => suppliedRenderer ?? createDOMRenderer());
    const [themeId, setThemeId] = React.useState<ThemeId>('web-light');
    const [dir, setDir] = React.useState<TextDirection>('ltr');
    const theme: Theme = THEMES[themeId].theme;
    const source = story.parameters?.fullSource;

    const openSandbox = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!source) {
          return;
        }
        openInStackBlitz(
          {
            ...SANDBOX_DEPENDENCIES,
            storyFile: source,
            storyExportToken: name,
            title: 'FluentUI React v9',
            description: name,
            cssModuleSources: story.parameters?.cssModuleSources,
          },
          event.currentTarget.ownerDocument,
        );
      },
      [source, name, story],
    );

    return (
      <SSRProvider>
        <RendererProvider renderer={renderer}>
          <div ref={ref} data-example-name={name} className="not-prose">
            <PreviewSettingsProvider value={{ theme, themeId, dir }}>
              <StoryPreview story={story} name={name} args={story.args} decorators={decorators} />
            </PreviewSettingsProvider>
            <div
              data-example-toolbar=""
              style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '8px 0', fontSize: 12 }}
            >
              {headless ? null : (
                <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  Theme
                  <select
                    value={themeId}
                    onChange={event => isThemeId(event.target.value) && setThemeId(event.target.value)}
                    style={control}
                  >
                    {Object.entries(THEMES).map(([id, entry]) => (
                      <option key={id} value={id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" role="switch" checked={dir === 'rtl'} onChange={event => setDir(event.target.checked ? 'rtl' : 'ltr')} />
                Right-to-left
              </label>
              {source ? (
                <button type="button" onClick={openSandbox} style={control}>
                  Open in StackBlitz
                </button>
              ) : null}
            </div>
          </div>
        </RendererProvider>
      </SSRProvider>
    );
  },
);
Example.displayName = 'Example';
