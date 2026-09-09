import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Replace with the final production domain before publishing.
  // Canonicals, RSS, robots.txt and sitemap all use this single value.
  site: 'https://criticallatitude.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  devToolbar: { enabled: false },
});
