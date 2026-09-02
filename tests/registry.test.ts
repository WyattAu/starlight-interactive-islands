import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { ComponentRegistry, ComponentRegistryError } from '../src/registry.js';

const TEST_FILE = fileURLToPath(import.meta.url);

describe('ComponentRegistry', () => {
  const createBaseOptions = (components: Record<string, any> = {}) => ({
    components,
  });

  describe('constructor', () => {
    it('should create an empty registry', () => {
      const registry = new ComponentRegistry(createBaseOptions());
      expect(registry.getAll()).toEqual([]);
    });

    it('should register components from options', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.get('MyButton')?.name).toBe('MyButton');
    });

    it('should apply default hydration strategy', () => {
      const registry = new ComponentRegistry({
        ...createBaseOptions({
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
          },
        }),
        defaultHydration: 'idle',
      });

      expect(registry.get('MyButton')?.hydration).toBe('idle');
    });

    it('should apply default framework', () => {
      const registry = new ComponentRegistry({
        ...createBaseOptions({
          MyButton: {
            component: '/path/to/Button.wat',
            hydration: 'load' as const,
          },
        }),
        defaultFramework: 'vue',
      });

      expect(registry.get('MyButton')?.framework).toBe('vue');
    });

    it('should apply wrapper defaults', () => {
      const registry = new ComponentRegistry({
        components: {
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        },
        wrapper: {
          tag: 'section',
          class: 'island-wrapper',
        },
      });

      const comp = registry.get('MyButton')!;
      expect(comp.wrapperTag).toBe('section');
      expect(comp.wrapperClass).toBe('island-wrapper');
    });

    it('should throw on invalid component name', () => {
      expect(
        () =>
          new ComponentRegistry(
            createBaseOptions({
              'invalid-name': {
                component: '/path/to/Button.tsx',
                framework: 'react' as const,
                hydration: 'visible' as const,
              },
            }),
          ),
      ).toThrow(ComponentRegistryError);
    });

    it('should throw on duplicate component name', () => {
      expect(
        () =>
          new ComponentRegistry(
            createBaseOptions({
              MyButton: {
                component: '/path/to/Button.tsx',
                framework: 'react' as const,
                hydration: 'visible' as const,
              },
            }),
          ),
      ).not.toThrow();

      const registry = new ComponentRegistry(
        createBaseOptions({
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      expect(() =>
        registry.register({
          name: 'MyButton',
          component: '/path/to/OtherButton.tsx',
          framework: 'react',
          hydration: 'visible',
        }),
      ).toThrow(ComponentRegistryError);
    });

    it('should throw when media hydration has no mediaQuery', () => {
      expect(
        () =>
          new ComponentRegistry(
            createBaseOptions({
              MyButton: {
                component: '/path/to/Button.tsx',
                framework: 'react' as const,
                hydration: 'media' as const,
              },
            }),
          ),
      ).toThrow(ComponentRegistryError);
    });

    it('should accept valid media hydration with mediaQuery', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'media' as const,
            mediaQuery: '(min-width: 768px)',
          },
        }),
      );

      expect(registry.get('MyButton')?.mediaQuery).toBe('(min-width: 768px)');
    });
  });

  describe('register', () => {
    it('should register a new component', () => {
      const registry = new ComponentRegistry(createBaseOptions());
      registry.register({
        name: 'MyWidget',
        component: '/path/to/Widget.tsx',
        framework: 'react',
        hydration: 'load',
      });

      expect(registry.get('MyWidget')).toBeDefined();
      expect(registry.getAll()).toHaveLength(1);
    });

    it('should throw on invalid name', () => {
      const registry = new ComponentRegistry(createBaseOptions());
      expect(() =>
        registry.register({
          name: 'lowercase',
          component: '/path/to/Widget.tsx',
          framework: 'react',
          hydration: 'load',
        }),
      ).toThrow(ComponentRegistryError);
    });

    it('should throw on duplicate name', () => {
      const registry = new ComponentRegistry(createBaseOptions());
      registry.register({
        name: 'MyWidget',
        component: '/path/to/Widget.tsx',
        framework: 'react',
        hydration: 'load',
      });

      expect(() =>
        registry.register({
          name: 'MyWidget',
          component: '/path/to/Other.tsx',
          framework: 'react',
          hydration: 'load',
        }),
      ).toThrow(/already registered/);
    });
  });

  describe('get', () => {
    it('should return component by name', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          MyButton: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      expect(registry.get('MyButton')?.name).toBe('MyButton');
    });

    it('should return undefined for unknown component', () => {
      const registry = new ComponentRegistry(createBaseOptions());
      expect(registry.get('Unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered components', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
          Card: {
            component: '/path/to/Card.tsx',
            framework: 'react' as const,
            hydration: 'load' as const,
          },
        }),
      );

      expect(registry.getAll()).toHaveLength(2);
      expect(registry.getAll().map((c) => c.name)).toContain('Button');
      expect(registry.getAll().map((c) => c.name)).toContain('Card');
    });
  });

  describe('getByFramework', () => {
    it('should filter by framework', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
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
        }),
      );

      expect(registry.getByFramework('react')).toHaveLength(1);
      expect(registry.getByFramework('react')[0].name).toBe('ReactComp');
      expect(registry.getByFramework('vue')).toHaveLength(1);
      expect(registry.getByFramework('svelte')).toHaveLength(0);
    });
  });

  describe('getNames', () => {
    it('should return all component names', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
          Card: {
            component: '/path/to/Card.tsx',
            framework: 'react' as const,
            hydration: 'load' as const,
          },
        }),
      );

      expect(registry.getNames()).toEqual(['Button', 'Card']);
    });
  });

  describe('has', () => {
    it('should return true for registered component', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      expect(registry.has('Button')).toBe(true);
      expect(registry.has('Unknown')).toBe(false);
    });
  });

  describe('validate', () => {
    it('should report missing component files', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Missing: {
            component: '/nonexistent/path.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      const result = registry.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].componentName).toBe('Missing');
      expect(result.errors[0].message).toContain('not found');
    });

    it('should report only strategy without clientOnlyFramework', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          ClientOnly: {
            component: '/nonexistent/path.tsx',
            framework: 'react' as const,
            hydration: 'only' as const,
          },
        }),
      );

      const result = registry.validate();
      const onlyError = result.errors.find((e) => e.message.includes('clientOnlyFramework'));
      expect(onlyError).toBeDefined();
    });

    it('should report media strategy without mediaQuery', () => {
      const registry = new ComponentRegistry({
        components: {
          MediaQuery: {
            component: '/nonexistent/path.tsx',
            framework: 'react' as const,
            hydration: 'media' as const,
            mediaQuery: '(min-width: 768px)',
          },
        },
      });

      const result = registry.validate();
      const mediaError = result.errors.find((e) => e.message.includes('mediaQuery'));
      expect(mediaError).toBeUndefined();
    });

    it('should return valid for well-formed components', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Good: {
            component: TEST_FILE,
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      const result = registry.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateImports', () => {
    it('should generate import statements', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      const imports = registry.generateImports();
      expect(imports).toHaveLength(1);
      expect(imports[0]).toBe("import Button from '/path/to/Button.tsx';");
    });

    it('should generate imports for multiple components', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
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
        }),
      );

      const imports = registry.generateImports();
      expect(imports).toHaveLength(2);
    });
  });

  describe('generateIslandWrapper', () => {
    it('should generate wrapper with client:visible', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
      );

      const wrapper = registry.generateIslandWrapper(registry.get('Button')!);
      expect(wrapper).toContain('client:visible');
      expect(wrapper).toContain('<Button');
      expect(wrapper).toContain('<div>');
    });

    it('should generate wrapper with client:only', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          ClientOnly: {
            component: '/path/to/Comp.tsx',
            framework: 'react' as const,
            hydration: 'only' as const,
            clientOnlyFramework: 'react' as const,
          },
        }),
      );

      const wrapper = registry.generateIslandWrapper(registry.get('ClientOnly')!);
      expect(wrapper).toContain('client:only="react"');
    });

    it('should generate wrapper with client:media', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          MediaQuery: {
            component: '/path/to/Comp.tsx',
            framework: 'react' as const,
            hydration: 'media' as const,
            mediaQuery: '(min-width: 768px)',
          },
        }),
      );

      const wrapper = registry.generateIslandWrapper(registry.get('MediaQuery')!);
      expect(wrapper).toContain('client:media="(min-width: 768px)"');
    });

    it('should use custom wrapper tag and class', () => {
      const registry = new ComponentRegistry({
        ...createBaseOptions({
          Button: {
            component: '/path/to/Button.tsx',
            framework: 'react' as const,
            hydration: 'visible' as const,
          },
        }),
        wrapper: {
          tag: 'section',
          class: 'island-wrap',
        },
      });

      const wrapper = registry.generateIslandWrapper(registry.get('Button')!);
      expect(wrapper).toContain('<section');
      expect(wrapper).toContain('class="island-wrap"');
    });
  });

  describe('getRequiredFrameworks', () => {
    it('should return unique frameworks', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
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
          AnotherReact: {
            component: '/path/to/Comp2.tsx',
            framework: 'react' as const,
            hydration: 'idle' as const,
          },
        }),
      );

      const frameworks = registry.getRequiredFrameworks();
      expect(frameworks.size).toBe(2);
      expect(frameworks.has('react')).toBe(true);
      expect(frameworks.has('vue')).toBe(true);
    });

    it('should include clientOnlyFramework', () => {
      const registry = new ComponentRegistry(
        createBaseOptions({
          ClientOnly: {
            component: '/path/to/Comp.tsx',
            framework: 'react' as const,
            hydration: 'only' as const,
            clientOnlyFramework: 'preact' as const,
          },
        }),
      );

      const frameworks = registry.getRequiredFrameworks();
      expect(frameworks.has('react')).toBe(true);
      expect(frameworks.has('preact')).toBe(true);
    });
  });
});
