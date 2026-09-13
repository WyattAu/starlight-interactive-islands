import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { starlightInteractiveIslands } from '@wyatt/starlight-interactive-islands';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Scratch Site',
      sidebar: [{ label: 'Guide', autogenerate: { directory: 'guide' } }],
      plugins: [
        starlightInteractiveIslands({
          components: {
            Counter: {
              component: './src/components/Counter.tsx',
              framework: 'react',
              hydration: 'visible',
            },
          },
        }),
      ],
    }),
    mdx(),
    react(),
  ],
});
