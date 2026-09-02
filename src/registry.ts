import type {
  IslandComponent,
  IslandComponentInput,
  InteractiveIslandsOptions,
  Framework,
  ValidationResult,
  ValidationError,
} from './types.js';
import {
  resolveComponentPath,
  detectFramework,
  isValidComponentName,
  componentPathExists,
  generateIslandTag,
} from './utils.js';

export class ComponentRegistry {
  private components: Map<string, IslandComponent> = new Map();
  private root: string;
  private defaultHydration: NonNullable<InteractiveIslandsOptions['defaultHydration']>;
  private defaultFramework: NonNullable<InteractiveIslandsOptions['defaultFramework']>;
  private defaultWrapper: InteractiveIslandsOptions['wrapper'];

  constructor(options: InteractiveIslandsOptions, root: string = process.cwd()) {
    this.root = root;
    this.defaultHydration = options.defaultHydration ?? 'visible';
    this.defaultFramework = options.defaultFramework ?? 'react';
    this.defaultWrapper = options.wrapper;

    for (const [name, input] of Object.entries(options.components)) {
      this.registerFromInput(name, input);
    }
  }

  private registerFromInput(name: string, input: IslandComponentInput): void {
    if (!isValidComponentName(name)) {
      throw new ComponentRegistryError(
        `Invalid component name "${name}". Must start with uppercase and contain only alphanumeric characters.`,
      );
    }

    if (this.components.has(name)) {
      throw new ComponentRegistryError(`Component "${name}" is already registered.`);
    }

    const resolvedPath = resolveComponentPath(input.component, this.root);
    const framework = input.framework ?? detectFramework(resolvedPath) ?? this.defaultFramework;

    const component: IslandComponent = {
      name,
      component: resolvedPath,
      framework,
      hydration: input.hydration ?? this.defaultHydration,
      mediaQuery: input.mediaQuery,
      clientOnlyFramework: input.clientOnlyFramework,
      serializableProps: input.serializableProps,
      wrapperTag: input.wrapperTag ?? this.defaultWrapper?.tag,
      wrapperClass: input.wrapperClass ?? this.defaultWrapper?.class,
    };

    if (component.hydration === 'media' && !component.mediaQuery) {
      throw new ComponentRegistryError(
        `Component "${name}" uses "media" hydration strategy but no mediaQuery was provided.`,
      );
    }

    this.components.set(name, component);
  }

  register(component: IslandComponent): void {
    if (!isValidComponentName(component.name)) {
      throw new ComponentRegistryError(
        `Invalid component name "${component.name}". Must start with uppercase and contain only alphanumeric characters.`,
      );
    }

    if (this.components.has(component.name)) {
      throw new ComponentRegistryError(`Component "${component.name}" is already registered.`);
    }

    this.components.set(component.name, component);
  }

  get(name: string): IslandComponent | undefined {
    return this.components.get(name);
  }

  getAll(): IslandComponent[] {
    return Array.from(this.components.values());
  }

  getByFramework(framework: Framework): IslandComponent[] {
    return this.getAll().filter((c) => c.framework === framework);
  }

  getNames(): string[] {
    return Array.from(this.components.keys());
  }

  has(name: string): boolean {
    return this.components.has(name);
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    for (const component of this.getAll()) {
      if (!componentPathExists(component.component)) {
        errors.push({
          componentName: component.name,
          message: `Component file not found: ${component.component}`,
        });
      }

      if (component.hydration === 'only' && !component.clientOnlyFramework) {
        errors.push({
          componentName: component.name,
          message: `"only" hydration strategy requires clientOnlyFramework to be specified.`,
        });
      }

      if (component.hydration === 'media' && !component.mediaQuery) {
        errors.push({
          componentName: component.name,
          message: `"media" hydration strategy requires mediaQuery to be specified.`,
        });
      }

      if (component.hydration !== 'only' && component.hydration !== 'media') {
        if (component.mediaQuery) {
          errors.push({
            componentName: component.name,
            message: `mediaQuery is only applicable with "media" hydration strategy, but got "${component.hydration}".`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  generateImports(): string[] {
    return this.getAll().map((component) => {
      return `import ${component.name} from '${component.component}';`;
    });
  }

  generateIslandWrapper(component: IslandComponent): string {
    const tag = component.wrapperTag ?? 'div';
    const classAttr = component.wrapperClass ? ` class="${component.wrapperClass}"` : '';
    const directive = component.hydration === 'only'
      ? `client:only="${component.clientOnlyFramework ?? component.framework}"`
      : component.hydration === 'media'
        ? `client:media="${component.mediaQuery}"`
        : `client:${component.hydration}`;

    return `<${tag}${classAttr}>\n  <${component.name} ${directive} />\n</${tag}>`;
  }

  getRequiredFrameworks(): Set<Framework> {
    const frameworks = new Set<Framework>();
    for (const component of this.getAll()) {
      frameworks.add(component.framework);
      if (component.clientOnlyFramework) {
        frameworks.add(component.clientOnlyFramework);
      }
    }
    return frameworks;
  }
}

export class ComponentRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentRegistryError';
  }
}
