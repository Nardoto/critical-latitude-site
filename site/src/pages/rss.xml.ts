import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from '../lib/posts';
import { siteName, siteDescription } from '../data/site';
export async function GET(context: APIContext) {
  return rss({ title: siteName, description: siteDescription, site: context.site!, items: (await getPosts()).map(post => ({ title: post.data.title, description: post.data.description, pubDate: post.data.pubDate, link: postUrl(post), categories: [post.data.category] })), customData: '<language>en-us</language>' });
}
