import * as Babel from '@babel/core';
import * as path from 'path';
import * as fs from 'fs';
import { inlineLocalImports } from './inlineLocalImports';
import { fullSourcePlugin } from './fullsource';

const stories = path.resolve(__dirname, '../../react-headless-components-preview/stories/src');

describe('inlineLocalImports', () => {
  it('renames colliding helper declarations and deduplicates their shared dependencies', () => {
    const filename = path.join(stories, 'TagPicker/TagPickerNoPopover.stories.tsx');
    const source = `
      import * as React from 'react';
      import { SelectedTag as ImportedTag, getInitials } from './utils';
      const Media = 'existing';
      export const Example = () => <><ImportedTag value={getInitials('Ada Lovelace')} /><span>{Media}</span></>;
    `;
    const result = inlineLocalImports(Babel, source, filename);
    expect(result.code).toContain('const Media1');
    expect(result.code).toContain('media={<Media1');
    expect(result.code).toContain('const Media =');
    expect(result.code).not.toContain('ImportedTag');
    const ast = Babel.parseSync(result.code, {
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ['typescript', 'jsx'] },
    });
    const reactImports = ast!.program.body.filter(
      node => Babel.types.isImportDeclaration(node) && node.source.value === 'react',
    );
    expect(reactImports).toHaveLength(1);
  });

  it('fails explicitly for an unresolved helper instead of dropping its import', () => {
    expect(() =>
      inlineLocalImports(
        Babel,
        `import { Missing } from './not-a-helper';`,
        path.join(stories, 'TagPicker/example.tsx'),
      ),
    ).toThrow('Cannot inline local example import');
  });

  it.each([
    ['Concepts/Positioning/PositioningFallbackPositions.stories.tsx', 'InlineAnchored'],
    ['Concepts/Positioning/PositioningFlippingBlock.stories.tsx', 'InlineAnchored'],
    ['Concepts/Positioning/PositioningFlippingInline.stories.tsx', 'InlineAnchored'],
    ['Concepts/Positioning/PositioningFlippingCorner.stories.tsx', 'InlineAnchored'],
    ['TagPicker/TagPickerNoPopover.stories.tsx', 'SelectedTag'],
  ])('includes helpers and CSS for %s', (file, helper) => {
    const filename = path.join(stories, file);
    const result = inlineLocalImports(Babel, fs.readFileSync(filename, 'utf8'), filename);
    expect(result.code).toContain(`const ${helper}`);
    expect(result.code).not.toMatch(/from ['"]\.\/(InlineAnchored|utils)['"]/);
    expect(result.cssModules).toHaveLength(1);
    expect(result.cssModules[0].source).not.toHaveLength(0);
    expect(() =>
      Babel.parseSync(result.code, {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
      }),
    ).not.toThrow();
    if (helper === 'SelectedTag') {
      expect(result.code).toContain('const Media');
      expect(result.code).toContain('const getInitials');
      expect(result.code).toContain('const tagPickerPositioning');
    }
  });

  it.each([false, true])('exports usable helper source (inlineLocalImports=%s)', enabled => {
    const filename = path.join(stories, 'TagPicker/TagPickerNoPopover.stories.tsx');
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const result = Babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        filename,
        babelrc: false,
        configFile: false,
        ast: true,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: [
          [
            fullSourcePlugin,
            {
              importMappings: {},
              cssModules: true,
              storyGranularity: 'story',
              inlineLocalImports: enabled,
            },
          ],
        ],
      });
      let source = '';
      Babel.traverse(result!.ast!, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AssignmentExpression(node) {
          const { left, right } = node.node;
          if (
            Babel.types.isMemberExpression(left) &&
            Babel.types.isIdentifier(left.property, { name: 'fullSource' }) &&
            Babel.types.isStringLiteral(right)
          ) {
            source = right.value;
          }
        },
      });
      expect(source.includes('const SelectedTag')).toBe(enabled);
      expect(source.includes('const getInitials')).toBe(enabled);
      expect(source).toContain('./styles/tag-picker.module.css');
      expect(warnings.mock.calls.some(([message]) => String(message).includes("'./utils'"))).toBe(!enabled);
    } finally {
      warnings.mockRestore();
    }
  });
});
