import * as ts from 'typescript';

/**
 * Static analysis of emitted JavaScript.
 *
 * Since TypeScript 6 the published ES5/AMD artifacts of v8 packages are not produced by `tsc`
 * anymore (`target: 'es5'` and `module: 'amd'` were removed), but by a SWC post processing step.
 * These helpers are the shared "did we emit what we promised" checks used both by unit tests of
 * that step and by `verify-packaging`, which runs against the actual published files on CI.
 */

export type EsTarget = 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022';

const targetOrder: EsTarget[] = [
  'es5',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
];

export interface EsFeature {
  /** syntax construct which was found, eg `ArrowFunction` */
  name: string;
  /** lowest ECMAScript version the construct can be emitted for */
  minTarget: EsTarget;
}

/**
 * Names are declared explicitly (instead of using the `ts.SyntaxKind` reverse mapping) because
 * several kinds share a numeric value with a marker entry (eg `NoSubstitutionTemplateLiteral` maps
 * back to `FirstTemplateToken`), which would make the reported feature names unstable.
 */
const featureByKind: Partial<Record<ts.SyntaxKind, EsFeature>> = {
  [ts.SyntaxKind.ArrowFunction]: { name: 'ArrowFunction', minTarget: 'es2015' },
  [ts.SyntaxKind.ClassDeclaration]: { name: 'ClassDeclaration', minTarget: 'es2015' },
  [ts.SyntaxKind.ClassExpression]: { name: 'ClassExpression', minTarget: 'es2015' },
  [ts.SyntaxKind.TemplateExpression]: { name: 'TemplateExpression', minTarget: 'es2015' },
  [ts.SyntaxKind.NoSubstitutionTemplateLiteral]: { name: 'NoSubstitutionTemplateLiteral', minTarget: 'es2015' },
  [ts.SyntaxKind.TaggedTemplateExpression]: { name: 'TaggedTemplateExpression', minTarget: 'es2015' },
  [ts.SyntaxKind.SpreadElement]: { name: 'SpreadElement', minTarget: 'es2015' },
  [ts.SyntaxKind.ShorthandPropertyAssignment]: { name: 'ShorthandPropertyAssignment', minTarget: 'es2015' },
  [ts.SyntaxKind.ObjectBindingPattern]: { name: 'ObjectBindingPattern', minTarget: 'es2015' },
  [ts.SyntaxKind.ArrayBindingPattern]: { name: 'ArrayBindingPattern', minTarget: 'es2015' },
  [ts.SyntaxKind.ComputedPropertyName]: { name: 'ComputedPropertyName', minTarget: 'es2015' },
  [ts.SyntaxKind.ForOfStatement]: { name: 'ForOfStatement', minTarget: 'es2015' },
  [ts.SyntaxKind.MetaProperty]: { name: 'MetaProperty', minTarget: 'es2015' },
  [ts.SyntaxKind.AwaitExpression]: { name: 'AwaitExpression', minTarget: 'es2017' },
  [ts.SyntaxKind.SpreadAssignment]: { name: 'SpreadAssignment', minTarget: 'es2018' },
  [ts.SyntaxKind.BigIntLiteral]: { name: 'BigIntLiteral', minTarget: 'es2020' },
  [ts.SyntaxKind.PropertyDeclaration]: { name: 'PropertyDeclaration', minTarget: 'es2022' },
  [ts.SyntaxKind.ClassStaticBlockDeclaration]: { name: 'ClassStaticBlockDeclaration', minTarget: 'es2022' },
  [ts.SyntaxKind.PrivateIdentifier]: { name: 'PrivateIdentifier', minTarget: 'es2022' },
};

const featureByOperator: Partial<Record<ts.SyntaxKind, EsFeature>> = {
  [ts.SyntaxKind.AsteriskAsteriskToken]: { name: 'ExponentiationOperator', minTarget: 'es2016' },
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken]: { name: 'ExponentiationAssignment', minTarget: 'es2016' },
  [ts.SyntaxKind.QuestionQuestionToken]: { name: 'NullishCoalescing', minTarget: 'es2020' },
  [ts.SyntaxKind.BarBarEqualsToken]: { name: 'LogicalOrAssignment', minTarget: 'es2021' },
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken]: { name: 'LogicalAndAssignment', minTarget: 'es2021' },
  [ts.SyntaxKind.QuestionQuestionEqualsToken]: { name: 'NullishCoalescingAssignment', minTarget: 'es2021' },
};

function isFunctionLikeDeclaration(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function isAbove(feature: EsTarget, target: EsTarget) {
  return targetOrder.indexOf(feature) > targetOrder.indexOf(target);
}

/**
 * Finds every syntax construct within `code` which cannot be emitted for `target`.
 */
export function findSyntaxAboveTarget(code: string, target: EsTarget, fileName = 'output.js'): EsFeature[] {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const found = new Map<string, EsFeature>();

  const add = (name: string, minTarget: EsTarget) => {
    if (isAbove(minTarget, target)) {
      found.set(name, { name, minTarget });
    }
  };
  const addFeature = (feature: EsFeature | undefined) => {
    if (feature) {
      add(feature.name, feature.minTarget);
    }
  };

  const visit = (node: ts.Node) => {
    addFeature(featureByKind[node.kind]);

    if (ts.isBinaryExpression(node)) {
      addFeature(featureByOperator[node.operatorToken.kind]);
    }

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) || ts.isCallExpression(node)) {
      if (node.questionDotToken) {
        add('OptionalChaining', 'es2020');
      }
    }

    if (ts.isVariableDeclarationList(node)) {
      const declarationKeyword = node.getFirstToken()?.kind;

      if (declarationKeyword === ts.SyntaxKind.LetKeyword) {
        add('LetDeclaration', 'es2015');
      }
      if (declarationKeyword === ts.SyntaxKind.ConstKeyword) {
        add('ConstDeclaration', 'es2015');
      }
    }

    if (isFunctionLikeDeclaration(node)) {
      if ('asteriskToken' in node && node.asteriskToken) {
        add('Generator', 'es2015');
      }
      if (ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
        add('AsyncFunction', 'es2017');
      }
      for (const parameter of node.parameters) {
        if (parameter.initializer) {
          add('DefaultParameter', 'es2015');
        }
        if (parameter.dotDotDotToken) {
          add('RestParameter', 'es2015');
        }
      }
    }

    if (ts.isMethodDeclaration(node) && ts.isObjectLiteralExpression(node.parent)) {
      add('ObjectLiteralMethod', 'es2015');
    }

    if (ts.isCatchClause(node) && !node.variableDeclaration) {
      add('OptionalCatchBinding', 'es2019');
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return [...found.values()];
}

export type ModuleShape = 'amd' | 'esm' | 'commonjs' | 'script';

/**
 * Determines the module format of emitted JavaScript.
 */
export function detectModuleShape(code: string, fileName = 'output.js'): ModuleShape {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);

  const hasEsmSyntax = sourceFile.statements.some(
    statement =>
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      Boolean(
        ts.canHaveModifiers(statement) &&
          ts
            .getModifiers(statement)
            ?.some(
              modifier =>
                modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword,
            ),
      ),
  );

  if (hasEsmSyntax) {
    return 'esm';
  }

  const firstStatement = sourceFile.statements.find(
    statement => !(ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)),
  );

  if (
    firstStatement &&
    ts.isExpressionStatement(firstStatement) &&
    ts.isCallExpression(firstStatement.expression) &&
    ts.isIdentifier(firstStatement.expression.expression) &&
    firstStatement.expression.expression.text === 'define'
  ) {
    return 'amd';
  }

  const hasCommonJsSyntax = /\brequire\s*\(|\bmodule\.exports\b|\bexports\.[A-Za-z_$]/.test(code);

  return hasCommonJsSyntax ? 'commonjs' : 'script';
}
