# PATTERN_ADOPTION

Starlight plugin embedding framework components in MDX as Astro
islands with declarative hydration directives.

| Pattern | Status | Evidence |
|---|---|---|
| T43 | partial | src/registry.ts:151 (generateIslandWrapper emits client directives so Astro reconciles the DOM; the reconciliation runtime is Astro's, not this repo's) |
| T13 | n/a | build-time registry and MDX codegen (src/registry.ts:20); the client-side runtime belongs to Astro |

The registry validates names, paths, and hydration combinations at
config time and fails fast (src/registry.ts:41); no runtime pattern
from the canon series runs inside rendered pages.
