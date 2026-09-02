import { describe, it, expect } from 'vitest';
import {
  resolveComponentPath,
  detectFramework,
  isValidComponentName,
  hydrationToDirective,
  generateIslandTag,
} from '../src/utils.js';
import type { IslandComponent } from '../src/types.js';

describe('utils', () => {
  describe('resolveComponentPath', () => {
    it('should return absolute paths unchanged', () => {
      expect(resolveComponentPath('/abs/path/Button.tsx', '/root')).toBe(
        '/abs/path/Button.tsx',
      );
    });

    it('should resolve relative paths against root', () => {
      expect(resolveComponentPath('./components/Button.tsx', '/project/src')).toBe(
        '/project/src/components/Button.tsx',
      );
    });

    it('should resolve parent relative paths', () => {
      expect(resolveComponentPath('../shared/Button.tsx', '/project/src')).toBe(
        '/project/shared/Button.tsx',
      );
    });
  });

  describe('detectFramework', () => {
    it('should detect React from .tsx', () => {
      expect(detectFramework('Button.tsx')).toBe('react');
    });

    it('should detect React from .jsx', () => {
      expect(detectFramework('Button.jsx')).toBe('react');
    });

    it('should detect Svelte from .svelte', () => {
      expect(detectFramework('Button.svelte')).toBe('svelte');
    });

    it('should detect Vue from .vue', () => {
      expect(detectFramework('Button.vue')).toBe('vue');
    });

    it('should detect Solid from .solid.tsx', () => {
      expect(detectFramework('Button.solid.tsx')).toBe('solid-js');
    });

    it('should detect Solid from .solid.jsx', () => {
      expect(detectFramework('Button.solid.jsx')).toBe('solid-js');
    });

    it('should detect Solid from path convention', () => {
      expect(detectFramework('src/solid/Button.tsx')).toBe('solid-js');
    });

    it('should return null for unknown extensions', () => {
      expect(detectFramework('Button.wat')).toBeNull();
    });

    it('should return null for .ts files', () => {
      expect(detectFramework('utils.ts')).toBeNull();
    });

    it('should return null for .js files', () => {
      expect(detectFramework('utils.js')).toBeNull();
    });
  });

  describe('isValidComponentName', () => {
    it('should accept valid PascalCase names', () => {
      expect(isValidComponentName('Button')).toBe(true);
      expect(isValidComponentName('MyComponent')).toBe(true);
      expect(isValidComponentName('ABC123')).toBe(true);
      expect(isValidComponentName('PracticeProblem')).toBe(true);
    });

    it('should reject lowercase names', () => {
      expect(isValidComponentName('button')).toBe(false);
    });

    it('should reject names starting with numbers', () => {
      expect(isValidComponentName('1Button')).toBe(false);
    });

    it('should reject names with hyphens', () => {
      expect(isValidComponentName('my-button')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(isValidComponentName('Button!')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidComponentName('')).toBe(false);
    });

    it('should reject single letter lowercase', () => {
      expect(isValidComponentName('a')).toBe(false);
    });

    it('should accept single letter uppercase', () => {
      expect(isValidComponentName('A')).toBe(true);
    });
  });

  describe('hydrationToDirective', () => {
    it('should map all hydration strategies correctly', () => {
      expect(hydrationToDirective('load')).toBe('client:load');
      expect(hydrationToDirective('visible')).toBe('client:visible');
      expect(hydrationToDirective('idle')).toBe('client:idle');
      expect(hydrationToDirective('media')).toBe('client:media');
      expect(hydrationToDirective('only')).toBe('client:only');
    });
  });

  describe('generateIslandTag', () => {
    const baseComponent: IslandComponent = {
      name: 'MyButton',
      component: '/path/to/Button.tsx',
      framework: 'react',
      hydration: 'visible',
    };

    it('should generate a basic island tag', () => {
      const tag = generateIslandTag(baseComponent, {});
      expect(tag).toContain('<MyButton');
      expect(tag).toContain('client:visible');
      expect(tag).toContain('/>');
    });

    it('should serialize string props as attributes', () => {
      const tag = generateIslandTag(baseComponent, { title: 'Click me' });
      expect(tag).toContain('title="Click me"');
    });

    it('should serialize non-string props as JSON expressions', () => {
      const tag = generateIslandTag(baseComponent, { count: 42 });
      expect(tag).toContain('count={42}');
    });

    it('should serialize object props as JSON', () => {
      const tag = generateIslandTag(baseComponent, { config: { nested: true } });
      expect(tag).toContain('config={{"nested":true}}');
    });

    it('should add media query for media strategy', () => {
      const component: IslandComponent = {
        ...baseComponent,
        hydration: 'media',
        mediaQuery: '(min-width: 768px)',
      };

      const tag = generateIslandTag(component, {});
      expect(tag).toContain('client:media="(min-width: 768px)"');
    });

    it('should add client:only with framework', () => {
      const component: IslandComponent = {
        ...baseComponent,
        hydration: 'only',
        clientOnlyFramework: 'react',
      };

      const tag = generateIslandTag(component, {});
      expect(tag).toContain('client:only="react"');
    });

    it('should wrap with custom wrapper tag and class', () => {
      const component: IslandComponent = {
        ...baseComponent,
        wrapperTag: 'section',
        wrapperClass: 'island-wrapper',
      };

      const tag = generateIslandTag(component, {});
      expect(tag).toContain('<section');
      expect(tag).toContain('class="island-wrapper"');
      expect(tag).toContain('</section>');
    });

    it('should not wrap when no wrapper class is set', () => {
      const tag = generateIslandTag(baseComponent, {});
      expect(tag).not.toContain('<div>');
    });

    it('should handle client:load strategy', () => {
      const component: IslandComponent = {
        ...baseComponent,
        hydration: 'load',
      };

      const tag = generateIslandTag(component, {});
      expect(tag).toContain('client:load');
    });

    it('should handle client:idle strategy', () => {
      const component: IslandComponent = {
        ...baseComponent,
        hydration: 'idle',
      };

      const tag = generateIslandTag(component, {});
      expect(tag).toContain('client:idle');
    });

    it('should handle boolean props', () => {
      const tag = generateIslandTag(baseComponent, { disabled: true });
      expect(tag).toContain('disabled={true}');
    });

    it('should handle array props', () => {
      const tag = generateIslandTag(baseComponent, { items: [1, 2, 3] });
      expect(tag).toContain('items={[1,2,3]}');
    });
  });
});
