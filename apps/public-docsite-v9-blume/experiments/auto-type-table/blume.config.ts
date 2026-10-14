import { defineConfig } from 'blume';

// Experiment: does Blume's <AutoTypeTable> handle Fluent prop types (Slot<>, ComponentProps<>)?
export default defineConfig({
  title: 'AutoTypeTable experiment',
  content: { root: 'docs' },
  seo: { og: { enabled: false } },
});
