import * as React from 'react';

export const client = 'visible';

export interface StorybookEmbedProps {
  src: string;
  title: string;
  height?: number;
}

/**
 * Lazily embeds a story from an external Storybook (fluentui-contrib) in a resizable container.
 * The iframe is only created once the island hydrates, so a page full of embeds stays light.
 */
export default function StorybookEmbed({ src, title, height = 320 }: StorybookEmbedProps): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <div
      data-storybook-embed=""
      style={{
        resize: 'vertical',
        overflow: 'auto',
        minHeight: 120,
        height,
        border: '1px solid var(--color-border, #ddd)',
        borderRadius: 8,
        background: '#fff',
      }}
    >
      {mounted ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <p style={{ margin: 0, padding: 16, fontSize: 14, opacity: 0.7 }}>Loading {title}…</p>
      )}
    </div>
  );
}
