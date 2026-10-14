import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { relative, isAbsolute } from 'node:path';

/** One row of Blume's `<TypeTable type={...}>` map. */
export interface ApiProperty {
  type: string;
  description?: string;
  required?: boolean;
  default?: string;
}

/**
 * Extracts `<Component>Props` with the TypeScript compiler, keeping only properties declared in
 * Fluent sources (mirrors `mdx-plugins/fluent-type-table.ts`) and simplifying slot shorthand types.
 */
export function createApiExtractor() {
  const configPath = fileURLToPath(new URL('../tsconfig.docgen.json', import.meta.url));
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) {
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  }
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, fileURLToPath(new URL('../', import.meta.url)));
  const components = fileURLToPath(new URL('../../../packages/react-components/', import.meta.url));
  let previous: ts.Program | undefined;
  return (path: string, name: string): Record<string, ApiProperty> => {
    const program = ts.createProgram([path], parsed.options, undefined, previous);
    previous = program;
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(path);
    const module = source && checker.getSymbolAtLocation(source);
    const symbol = module && checker.getExportsOfModule(module).find(item => item.name === name);
    if (!symbol) {
      throw new Error(`Cannot extract ${name} from ${path}`);
    }
    // eslint-disable-next-line no-bitwise
    const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const type = checker.getDeclaredTypeOfSymbol(resolved);
    const properties = checker.getPropertiesOfType(type).filter(property =>
      property.declarations?.some(declaration => {
        const location = relative(components, declaration.getSourceFile().fileName).replaceAll('\\', '/');
        return (
          !isAbsolute(location) &&
          !location.startsWith('../') &&
          !location.includes('/node_modules/') &&
          location.includes('/src/')
        );
      }),
    );
    if (!properties.length) {
      throw new Error(`No Fluent properties extracted for ${name} in ${path}`);
    }
    return Object.fromEntries(
      properties
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(property => {
          const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? source!;
          let text = checker.typeToString(
            checker.getTypeOfSymbolAtLocation(property, declaration),
            declaration,
            ts.TypeFormatFlags.NoTruncation,
          );
          const declared = ts.isPropertySignature(declaration) ? declaration.type?.getText() : undefined;
          if (declared?.includes('Slot<')) {
            text = declared;
          }
          text = text
            .replace(/import\("[^"\n]*node_modules\/@types\/react\/index"\)\./g, 'React.')
            .replace(/import\("[^"\n]*\/([^/"\n]+)"\)\./g, '$1.');
          if (/WithSlotShorthandValue\s*</.test(text)) {
            const element = text.match(/as\?:\s*"([^"]+)"/)?.[1];
            text = element ? `Slot<"${element}">` : 'Slot';
          }
          const tags = property.getJsDocTags(checker);
          const defaultTag = tags.find(tag => tag.name === 'default' || tag.name === 'defaultValue');
          const description = ts.displayPartsToString(property.getDocumentationComment(checker));
          return [
            property.name,
            {
              type: text,
              ...(description ? { description } : {}),
              // eslint-disable-next-line no-bitwise
              ...(property.flags & ts.SymbolFlags.Optional ? {} : { required: true }),
              ...(defaultTag ? { default: ts.displayPartsToString(defaultTag.text) } : {}),
            },
          ];
        }),
    );
  };
}
