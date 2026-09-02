import type { InteractiveIslandsOptions } from './types.js';
import { ComponentRegistry, ComponentRegistryError } from './registry.js';
import { generateMDXImports, generateMDXComponents, generateAstroIntegrationConfig } from './auto-import.js';

export type { IslandComponent, InteractiveIslandsOptions, HydrationStrategy, Framework, ValidationResult } from './types.js';
export { ComponentRegistry, ComponentRegistryError } from './registry.js';
export { generateMDXImports, generateMDXComponents, generateAstroIntegrationConfig } from './auto-import.js';

const PLUGIN_NAME = 'starlight-interactive-islands';

interface StarlightHookContext {
  config: Record<string, unknown>;
  command: string;
  isRestart: boolean;
}

interface AstroIntegration {
  name: string;
  hooks: {
    'astro:config:setup'?: (options: {
      config: Record<string, unknown>;
      command: string;
      injectScript: (stage: string, content: string) => void;
      addWatchFile: (path: string) => void;
    }) => void;
    'astro:config:done'?: (options: { config: Record<string, unknown> }) => void;
  };
}

export function starlightInteractiveIslands(options: InteractiveIslandsOptions) {
  if (!options.components || Object.keys(options.components).length === 0) {
    throw new ComponentRegistryError('No components provided. The "components" option must contain at least one component.');
  }

  const registry = new ComponentRegistry(options);
  const validation = registry.validate();

  if (!validation.valid) {
    const errorMessages = validation.errors
      .map((e) => `  - ${e.componentName}: ${e.message}`)
      .join('\n');
    throw new ComponentRegistryError(`Component validation failed:\n${errorMessages}`);
  }

  const autoImport = options.autoImport ?? true;
  const integrationConfig = generateAstroIntegrationConfig(registry);

  const integration: AstroIntegration = {
    name: PLUGIN_NAME,
    hooks: {
      'astro:config:setup'({ injectScript }) {
        if (autoImport) {
          for (const imp of integrationConfig.imports) {
            injectScript('page', imp);
          }
        }
      },
    },
  };

  return {
    name: PLUGIN_NAME,
    integration,
    registry,
    getConfig() {
      return integrationConfig;
    },
  };
}

export default starlightInteractiveIslands;
