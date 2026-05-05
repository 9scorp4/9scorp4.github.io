import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import ogImages from './src/integrations/og-images.ts';

export default defineConfig({
  site: 'https://9scorp4.github.io',
  integrations: [mdx(), sitemap(), ogImages()],
  build: {
    assets: 'assets',
  },
});
