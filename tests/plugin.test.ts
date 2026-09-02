import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { starlightInteractiveIslands } from '../src/index.js';
import { ComponentRegistryError } from '../src/registry.js';

const TEST_FILE = fileURLToPath(import.meta.url);

describe('starlightInteractiveIslands plugin', () => {
  describe('basic plugin creation', () => {
    it('should create a plugin with valid options', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          PracticeProblem: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      expect(plugin.name).toBe('starlight-interactive-islands');
      expect(plugin.integration).toBeDefined();
      expect(plugin.integration.name).toBe('starlight-interactive-islands');
      expect(plugin.registry).toBeDefined();
    });

    it('should expose the registry', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      expect(plugin.registry.get('Button')).toBeDefined();
      expect(plugin.registry.get('Button')?.name).toBe('Button');
    });

    it('should expose integration config via getConfig', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      const config = plugin.getConfig();
      expect(config.imports).toHaveLength(1);
      expect(config.frameworks).toContain('react');
    });
  });

  describe('validation', () => {
    it('should throw on empty components', () => {
      expect(() =>
        starlightInteractiveIslands({
          components: {},
        }),
      ).toThrow(ComponentRegistryError);
    });

    it('should throw on missing components option', () => {
      expect(() =>
        starlightInteractiveIslands({
          components: undefined as any,
        }),
      ).toThrow();
    });

    it('should throw on invalid component name', () => {
      expect(() =>
        starlightInteractiveIslands({
          components: {
            'bad-name': {
              component: '/path/to/Comp.tsx',
              framework: 'react',
              hydration: 'visible',
            },
          },
        }),
      ).toThrow(ComponentRegistryError);
    });

    it('should throw on missing component file', () => {
      expect(() =>
        starlightInteractiveIslands({
          components: {
            Missing: {
              component: '/nonexistent/path.tsx',
              framework: 'react',
              hydration: 'visible',
            },
          },
        }),
      ).toThrow(ComponentRegistryError);
    });
  });

  describe('multiple frameworks', () => {
    it('should support React and Vue components together', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          ReactComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
          VueComp: {
            component: TEST_FILE,
            framework: 'vue',
            hydration: 'load',
          },
        },
      });

      const frameworks = plugin.registry.getRequiredFrameworks();
      expect(frameworks.has('react')).toBe(true);
      expect(frameworks.has('vue')).toBe(true);
    });

    it('should support Svelte and Solid together', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          SvelteComp: {
            component: TEST_FILE,
            framework: 'svelte',
            hydration: 'visible',
          },
          SolidComp: {
            component: TEST_FILE,
            framework: 'solid-js',
            hydration: 'idle',
          },
        },
      });

      const frameworks = plugin.registry.getRequiredFrameworks();
      expect(frameworks.has('svelte')).toBe(true);
      expect(frameworks.has('solid-js')).toBe(true);
    });
  });

  describe('hydration strategies', () => {
    it('should support client:load', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          LoadComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'load',
          },
        },
      });

      const comp = plugin.registry.get('LoadComp')!;
      expect(comp.hydration).toBe('load');
    });

    it('should support client:visible', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          VisibleComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      const comp = plugin.registry.get('VisibleComp')!;
      expect(comp.hydration).toBe('visible');
    });

    it('should support client:idle', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          IdleComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'idle',
          },
        },
      });

      const comp = plugin.registry.get('IdleComp')!;
      expect(comp.hydration).toBe('idle');
    });

    it('should support client:only with framework', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          OnlyComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'only',
            clientOnlyFramework: 'react',
          },
        },
      });

      const comp = plugin.registry.get('OnlyComp')!;
      expect(comp.hydration).toBe('only');
      expect(comp.clientOnlyFramework).toBe('react');
    });

    it('should support client:media with query', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          MediaComp: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'media',
            mediaQuery: '(min-width: 768px)',
          },
        },
      });

      const comp = plugin.registry.get('MediaComp')!;
      expect(comp.hydration).toBe('media');
      expect(comp.mediaQuery).toBe('(min-width: 768px)');
    });
  });

  describe('default options', () => {
    it('should default autoImport to true', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      const config = plugin.getConfig();
      expect(config.imports).toHaveLength(1);
    });

    it('should use defaultHydration when not specified', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            framework: 'react',
          },
        },
        defaultHydration: 'idle',
      });

      expect(plugin.registry.get('Button')?.hydration).toBe('idle');
    });

    it('should use defaultFramework when not specified', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            hydration: 'visible',
          },
        },
        defaultFramework: 'svelte',
      });

      expect(plugin.registry.get('Button')?.framework).toBe('svelte');
    });
  });

  describe('integration hooks', () => {
    it('should have astro:config:setup hook', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          Button: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
      });

      expect(plugin.integration.hooks['astro:config:setup']).toBeDefined();
    });
  });

  describe('real-world use case', () => {
    it('should handle the WyattsNotes component set', () => {
      const plugin = starlightInteractiveIslands({
        components: {
          PracticeProblem: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
            wrapperTag: 'div',
            wrapperClass: 'practice-problem-island',
          },
          FlashcardDeck: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
            wrapperTag: 'div',
            wrapperClass: 'flashcard-deck-island',
          },
          DiagnosticTest: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'load',
            wrapperTag: 'div',
            wrapperClass: 'diagnostic-test-island',
          },
          DesmosGraph: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
          Geogebra: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
          PhetSimulation: {
            component: TEST_FILE,
            framework: 'react',
            hydration: 'visible',
          },
        },
        defaultHydration: 'visible',
        defaultFramework: 'react',
      });

      expect(plugin.registry.getAll()).toHaveLength(6);
      expect(plugin.registry.getByFramework('react')).toHaveLength(6);
      expect(plugin.registry.get('PracticeProblem')?.wrapperClass).toBe('practice-problem-island');
      expect(plugin.registry.get('DiagnosticTest')?.hydration).toBe('load');
      expect(plugin.registry.get('DesmosGraph')?.hydration).toBe('visible');
    });
  });
});
