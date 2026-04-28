import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://9scorp4.github.io',
  integrations: [mdx()],
  build: {
    assets: 'assets',
  },
});
