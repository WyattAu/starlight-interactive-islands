export type HydrationStrategy = 'load' | 'visible' | 'idle' | 'media' | 'only';

export type Framework = 'react' | 'solid-js' | 'svelte' | 'vue' | 'preact';

export interface IslandComponent {
  name: string;
  component: string;
  framework: Framework;
  hydration: HydrationStrategy;
  mediaQuery?: string;
  clientOnlyFramework?: Framework;
  serializableProps?: string[];
  wrapperTag?: string;
  wrapperClass?: string;
}

export type IslandComponentInput = Omit<IslandComponent, 'name'>;

export interface InteractiveIslandsOptions {
  components: Record<string, IslandComponentInput>;
  autoImport?: boolean;
  defaultHydration?: HydrationStrategy;
  defaultFramework?: Framework;
  wrapper?: {
    tag?: string;
    class?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  componentName: string;
  message: string;
}

export interface StarlightPlugin {
  name: string;
  hooks: Record<string, unknown>;
}

export type { z } from 'zod';
