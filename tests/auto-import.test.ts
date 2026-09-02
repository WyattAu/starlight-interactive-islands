import { describe, it, expect } from 'vitest';
import { generateMDXImports, generateMDXComponents, generateAstroIntegrationConfig, generateGlobalTypeDeclaration } from '../src/auto-import.js';
import { ComponentRegistry } from '../src/registry.js';

function createRegistry(components: Record<string, any>) {
  return new ComponentRegistry({ components });
}

describe('auto-import', () => {
  describe('generateMDXImports', () => {
    it('should generate import for a single component', () => {
      const registry = createRegistry({
        Button: {
          component: '/path/to/Button.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
      });

      const result = generateMDXImports(registry);
      expect(result).toBe("import Button from '/path/to/Button.tsx';");
    });

    it('should generate imports for multiple components', () => {
      const registry = createRegistry({
        Button: {
          component: '/path/to/Button.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
        Card: {
          component: '/path/to/Card.vue',
          framework: 'vue' as const,
          hydration: 'load' as const,
        },
      });

      const result = generateMDXImports(registry);
      expect(result).toContain("import Button from '/path/to/Button.tsx';");
      expect(result).toContain("import Card from '/path/to/Card.vue';");
      expect(result.split('\n')).toHaveLength(2);
    });

    it('should return empty string for empty registry', () => {
      const registry = createRegistry({});
      const result = generateMDXImports(registry);
      expect(result).toBe('');
    });
  });

  describe('generateMDXComponents', () => {
    it('should generate component wrapper for visible strategy', () => {
      const registry = createRegistry({
        Button: {
          component: '/path/to/Button.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
      });

      const result = generateMDXComponents(registry);
      expect(result['Button']).toBeDefined();
      expect(result['Button']).toContain('client:visible');
      expect(result['Button']).toContain('<Button');
    });

    it('should generate component wrapper for client:only', () => {
      const registry = createRegistry({
        ClientOnly: {
          component: '/path/to/Comp.tsx',
          framework: 'react' as const,
          hydration: 'only' as const,
          clientOnlyFramework: 'react' as const,
        },
      });

      const result = generateMDXComponents(registry);
      expect(result['ClientOnly']).toContain('client:only="react"');
    });

    it('should generate component wrapper for media strategy', () => {
      const registry = createRegistry({
        MediaComp: {
          component: '/path/to/Comp.tsx',
          framework: 'react' as const,
          hydration: 'media' as const,
          mediaQuery: '(min-width: 768px)',
        },
      });

      const result = generateMDXComponents(registry);
      expect(result['MediaComp']).toContain('client:media="(min-width: 768px)"');
    });

    it('should use custom wrapper tag', () => {
      const registry = createRegistry({
        Button: {
          component: '/path/to/Button.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
          wrapperTag: 'section',
          wrapperClass: 'island-wrap',
        },
      });

      const result = generateMDXComponents(registry);
      expect(result['Button']).toContain('<section');
      expect(result['Button']).toContain('class="island-wrap"');
    });

    it('should return empty object for empty registry', () => {
      const registry = createRegistry({});
      const result = generateMDXComponents(registry);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('generateAstroIntegrationConfig', () => {
    it('should return imports, components, and frameworks', () => {
      const registry = createRegistry({
        ReactComp: {
          component: '/path/to/Comp.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
        VueComp: {
          component: '/path/to/Comp.vue',
          framework: 'vue' as const,
          hydration: 'load' as const,
        },
      });

      const config = generateAstroIntegrationConfig(registry);
      expect(config.imports).toHaveLength(2);
      expect(Object.keys(config.components)).toHaveLength(2);
      expect(config.frameworks).toContain('react');
      expect(config.frameworks).toContain('vue');
    });

    it('should deduplicate frameworks', () => {
      const registry = createRegistry({
        Comp1: {
          component: '/path/to/Comp1.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
        Comp2: {
          component: '/path/to/Comp2.tsx',
          framework: 'react' as const,
          hydration: 'load' as const,
        },
      });

      const config = generateAstroIntegrationConfig(registry);
      expect(config.frameworks).toHaveLength(1);
    });
  });

  describe('generateGlobalTypeDeclaration', () => {
    it('should generate type declarations for components', () => {
      const registry = createRegistry({
        Button: {
          component: '/path/to/Button.tsx',
          framework: 'react' as const,
          hydration: 'visible' as const,
        },
        Card: {
          component: '/path/to/Card.vue',
          framework: 'vue' as const,
          hydration: 'load' as const,
        },
      });

      const decl = generateGlobalTypeDeclaration(registry);
      expect(decl).toContain('declare global');
      expect(decl).toContain('Button: Record<string, any>');
      expect(decl).toContain('Card: Record<string, any>');
    });

    it('should generate valid empty declaration', () => {
      const registry = createRegistry({});
      const decl = generateGlobalTypeDeclaration(registry);
      expect(decl).toContain('declare global');
      expect(decl).toContain('export {}');
    });
  });
});
