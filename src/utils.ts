import type { Framework, HydrationStrategy, IslandComponent } from './types.js';
import { existsSync } from 'node:fs';
import { resolve, extname, relative, isAbsolute } from 'node:path';

const EXTENSION_FRAMEWORK_MAP: Record<string, Framework> = {
  '.tsx': 'react',
  '.jsx': 'react',
  '.svelte': 'svelte',
  '.vue': 'vue',
  '.solid.tsx': 'solid-js',
  '.solid.jsx': 'solid-js',
};

const VALID_JSX_NAME = /^[A-Z][a-zA-Z0-9]*$/;

export function resolveComponentPath(path: string, root: string): string {
  if (isAbsolute(path)) {
    return path;
  }
  return resolve(root, path);
}

export function detectFramework(filePath: string): Framework | null {
  const ext = extname(filePath);
  const base = filePath.replace(ext, '');
  const compoundExt = extname(base) + ext;

  if (filePath.includes('/solid/') || filePath.includes('\\solid\\')) {
    return 'solid-js';
  }

  if (EXTENSION_FRAMEWORK_MAP[compoundExt]) {
    return EXTENSION_FRAMEWORK_MAP[compoundExt];
  }

  if (EXTENSION_FRAMEWORK_MAP[ext]) {
    return EXTENSION_FRAMEWORK_MAP[ext];
  }

  return null;
}

export function isValidComponentName(name: string): boolean {
  return VALID_JSX_NAME.test(name);
}

export function hydrationToDirective(strategy: HydrationStrategy): string {
  const directives: Record<HydrationStrategy, string> = {
    load: 'client:load',
    visible: 'client:visible',
    idle: 'client:idle',
    media: 'client:media',
    only: 'client:only',
  };
  return directives[strategy];
}

export function generateIslandTag(
  component: IslandComponent,
  props: Record<string, unknown>,
): string {
  const directive = hydrationToDirective(component.hydration);
  const parts: string[] = [`<${component.name}`, `${directive}`];

  if (component.hydration === 'media' && component.mediaQuery) {
    parts.push(`client:media="${component.mediaQuery}"`);
  }

  if (component.hydration === 'only' && component.clientOnlyFramework) {
    parts.push(`client:only="${component.clientOnlyFramework}"`);
  }

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      parts.push(`${key}="${value}"`);
    } else {
      parts.push(`${key}={${JSON.stringify(value)}}`);
    }
  }

  const wrapperTag = component.wrapperTag ?? 'div';
  const wrapperClass = component.wrapperClass;

  const islandTag = parts.join(' ') + ' />';

  if (wrapperClass) {
    return `<${wrapperTag} class="${wrapperClass}">\n  ${islandTag}\n</${wrapperTag}>`;
  }

  return islandTag;
}

export function componentPathExists(path: string): boolean {
  return existsSync(path);
}

export function relativizeImportPath(absPath: string, fromFile: string): string {
  const dir = resolve(fromFile, '..');
  let rel = relative(dir, absPath);
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  return rel.replace(/\\/g, '/');
}
