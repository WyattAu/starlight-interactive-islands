# @wyatt/starlight-interactive-islands

Starlight plugin for embedding interactive framework components in MDX as Astro islands with configurable hydration strategies.

Astro islands normally require an `.astro` wrapper page per component. This plugin lets you register components once and drop them straight into Starlight MDX content, with per-component hydration control across React, Preact, Solid, Svelte, and Vue.

## Features

- **Use components directly in MDX** — register once, reference by name
- **Hydration strategies**: `load`, `visible`, `idle`, `media`, and `only` (client-only)
- **Framework-agnostic**: React, Preact, Solid JS, Svelte, and Vue
- **Automatic import + hydration directive injection** into MDX (optional — `autoImport: false` to manage imports yourself)
- **Registry validation** catches bad paths/frameworks at startup, not at runtime

The site must also install the matching framework integration for each registered
component (for example `@astrojs/react` + `react` + `react-dom`).

## Installation

```bash
npm install @wyatt/starlight-interactive-islands
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { starlightInteractiveIslands } from '@wyatt/starlight-interactive-islands';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightInteractiveIslands({
          components: {
            Counter: {
              component: '../src/components/Counter.tsx',
              framework: 'react',
              hydration: 'visible',
            },
          },
        }),
      ],
    }),
  ],
});
```

Then in any MDX page:

```mdx
<Counter start={5} />
```

## Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `components` | `Record<string, IslandComponent>` | — (required) | Map of component name to definition; must contain at least one entry |
| `autoImport` | `boolean` | `true` | Inject imports into every page |
| `defaultHydration` | `HydrationStrategy` | — | Default hydration strategy |
| `defaultFramework` | `Framework` | — | Default framework |
| `wrapper` | `{ tag?, class? }` | — | Default wrapper element around islands |

Each component entry supports:

| Field | Type | Description |
|---|---|---|
| `component` | `string` | Path to the component source |
| `framework` | `'react' \| 'solid-js' \| 'svelte' \| 'vue' \| 'preact'` | Component framework |
| `hydration` | `'load' \| 'visible' \| 'idle' \| 'media' \| 'only'` | When to hydrate |
| `mediaQuery` | `string` | Media query (for `media` hydration) |
| `clientOnlyFramework` | `Framework` | Framework for `client:only` rendering |
| `serializableProps` | `string[]` | Prop names that are serializable |
| `wrapperTag` / `wrapperClass` | `string` | Per-component wrapper overrides |

The returned object also exposes `registry` and `getConfig()` for programmatic access, and `ComponentRegistry` is exported for custom pipelines.

## License

MIT
