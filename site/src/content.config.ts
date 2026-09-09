import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { categorySlugs } from './data/categories';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    pubDate: z.coerce.date(),
    category: z.enum(categorySlugs),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    videoTitle: z.string().min(1),
    sources: z.array(z.object({ label: z.string().min(1), url: z.url() })).min(1),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});
export const collections = { posts };
