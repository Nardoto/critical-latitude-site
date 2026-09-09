import { getCollection, type CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export async function getPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}
export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const readingTime = (post: Post) => Math.max(1, Math.ceil((post.body ?? '').split(/\s+/).filter(Boolean).length / 220));
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
