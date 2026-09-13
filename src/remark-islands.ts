import path, { relative } from 'node:path';
import type { IslandComponent } from './types.js';

type MdastNode = {
  type: string;
  name?: string;
  attributes?: Array<{ name?: string } & Record<string, unknown>>;
  children?: MdastNode[];
};

type VFile = {
  history?: string[];
};

function directiveAttributes(component: IslandComponent): Array<Record<string, unknown>> {
  if (component.hydration === 'only') {
    return [
      {
        type: 'mdxJsxAttribute',
        name: 'client:only',
        value: component.clientOnlyFramework ?? component.framework,
      },
    ];
  }
  if (component.hydration === 'media') {
    return [
      {
        type: 'mdxJsxAttribute',
        name: 'client:media',
        value: component.mediaQuery,
      },
    ];
  }
  return [{ type: 'mdxJsxAttribute', name: `client:${component.hydration}`, value: null }];
}

function relativeImportSpecifier(fromFile: string, componentPath: string): string {
  let spec = componentPath;
  if (fromFile) {
    spec = relative(path.dirname(fromFile), componentPath);
  }
  if (!spec.startsWith('.')) spec = `./${spec}`;
  return spec.split(path.sep).join('/');
}

function mdxEsmImportNode(specifiers: Array<{ name: string; source: string }>): MdastNode {
  return {
    type: 'mdxjsEsm',
    value: specifiers.map(({ name, source }) => `import ${name} from '${source}';`).join('\n'),
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: specifiers.map(({ name, source }) => ({
          type: 'ImportDeclaration',
          specifiers: [
            {
              type: 'ImportDefaultSpecifier',
              local: { type: 'Identifier', name },
            },
          ],
          source: { type: 'Literal', value: source, raw: `'${source}'` },
        })),
      },
    },
  } as MdastNode;
}

/**
 * Creates a remark plugin that turns registered component names used in MDX
 * into hydrated Astro islands by injecting the matching import and the
 * configured `client:*` hydration directive.
 */
export function createIslandsRemarkPlugin(components: IslandComponent[]) {
  const byName = new Map(components.map((c) => [c.name, c]));

  return function islandsRemarkPlugin() {
    return function transformer(tree: MdastNode, vfile: VFile) {
      const file = vfile?.history?.[0] ?? '';
      const isMdx = file.endsWith('.mdx') || file === '';
      if (!isMdx) return;

      const imports = new Map<string, string>();

      function transform(node: MdastNode, component: IslandComponent): MdastNode {
        imports.set(component.name, component.component);

        const existing = node.attributes ?? [];
        const kept = existing.filter(
          (attr) => typeof attr?.name === 'string' && !attr.name.startsWith('client:')
        );
        node.attributes = [...kept, ...directiveAttributes(component)];

        if (component.wrapperTag && node.type === 'mdxJsxFlowElement') {
          return {
            type: 'mdxJsxFlowElement',
            name: component.wrapperTag,
            attributes: component.wrapperClass
              ? [{ type: 'mdxJsxAttribute', name: 'class', value: component.wrapperClass }]
              : [],
            children: [node],
          };
        }
        return node;
      }

      function visit(node: MdastNode): void {
        if (!node.children) return;
        node.children = node.children.map((child) => {
          const component =
            (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxSpanElement') && child.name
              ? byName.get(child.name)
              : undefined;
          const result = component ? transform(child, component) : child;
          visit(result);
          return result;
        });
      }

      visit(tree);

      if (imports.size > 0) {
        const specifiers = Array.from(imports.entries()).map(([name, componentPath]) => ({
          name,
          source: relativeImportSpecifier(file, componentPath),
        }));
        tree.children = [mdxEsmImportNode(specifiers), ...(tree.children ?? [])];
      }
    };
  };
}
