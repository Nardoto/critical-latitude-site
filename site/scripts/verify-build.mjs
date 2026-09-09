import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const listFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const categories = ['earthquakes', 'volcanoes', 'tsunamis', 'landslides-and-lahars', 'glaciers-and-sea-level', 'extreme-weather', 'infrastructure', 'preparedness'];
const required = ['index.html', 'blog/index.html', 'videos/index.html', 'guide/index.html', 'about/index.html', '404.html', 'rss.xml', 'sitemap-index.xml', 'sitemap-0.xml', 'robots.txt', ...categories.map(slug => `category/${slug}/index.html`)];
required.forEach(file => assert(fs.existsSync(path.join(dist, file)), `Missing route: ${file}`));
const blogListings = [path.join(dist, 'blog/index.html'), ...(fs.existsSync(path.join(dist, 'blog/page')) ? listFiles(path.join(dist, 'blog/page')).filter(file => file.endsWith('.html')) : [])].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const rss = fs.readFileSync(path.join(dist, 'rss.xml'), 'utf8');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8');
const report = { checkedAt: new Date().toISOString(), posts: [], htmlPages: 0, internalLinks: 0, videos: 0, externalImageHosts: [], errors: [] };
const imageHosts = new Set();
for (const file of listFiles(path.join(root, 'src/content/posts')).filter(file => file.endsWith('.md'))) {
  const text = fs.readFileSync(file, 'utf8');
  if (/^draft:\s*true\s*$/m.test(text)) continue;
  const slug = path.basename(file, '.md');
  const body = text.split(/^---\s*$/m).slice(2).join('---');
  const words = body.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const category = text.match(/^category:\s*(\S+)/m)?.[1];
  assert(words >= 700 && words <= 1000, `${slug}: ${words} words outside 700–1000`);
  assert(categories.includes(category), `Invalid category: ${slug}`);
  const url = `/blog/${slug}/`;
  const html = fs.readFileSync(path.join(dist, url, 'index.html'), 'utf8');
  assert(html.includes('application/ld+json') && html.includes('"@type":"Article"'), `Article JSON-LD: ${slug}`);
  assert(html.includes('In this article') && html.includes('id="sources-title"'), `TOC/sources: ${slug}`);
  assert(!html.includes('<iframe'), `Eager iframe: ${slug}`);
  assert(html.includes('This article is educational. It is not a prediction of an imminent event; live instructions come from your local emergency authorities.'), `Disclaimer: ${slug}`);
  assert(rss.includes(url) && sitemap.includes(url), `RSS/sitemap omission: ${slug}`);
  assert(blogListings.includes(url), `Not listed: ${slug}`);
  report.posts.push({ slug, category, words, numbers: [...new Set(body.match(/\b\d[\d,.]*(?:-\w+)?\b/g) ?? [])] });
}
for (const file of listFiles(dist).filter(file => file.endsWith('.html'))) {
  report.htmlPages++;
  const html = fs.readFileSync(file, 'utf8');
  assert((html.match(/<h1(?:\s|>)/g) ?? []).length === 1, `Single h1: ${file}`);
  assert(html.includes('lang="en"') && /<link[^>]+rel="canonical"/.test(html), `Language/canonical: ${file}`);
  for (const token of ['name="description"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"']) assert(html.includes(token), `${token}: ${file}`);
  assert(!/\$XX|CHECKOUT_URL|Lorem ipsum/.test(html), `Unresolved mockup placeholder: ${file}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${file}`);
  for (const match of html.matchAll(/\bhref="([^"\s]+)"/g)) {
    const href = match[1];
    if (href.startsWith('#')) { assert(ids.includes(href.slice(1)), `Missing anchor ${href}: ${file}`); continue; }
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const [pathname] = href.split(/[?#]/);
    const target = path.join(dist, pathname, pathname.endsWith('/') ? 'index.html' : '');
    assert(fs.existsSync(target), `Broken internal link ${href}: ${file}`); report.internalLinks++;
  }
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="(https?:[^"\s]+)"/g)) {
    const host = new URL(match[1]).hostname; imageHosts.add(host);
    assert.equal(host, 'img.youtube.com', `Disallowed image: ${match[1]}`);
  }
}
const videos = JSON.parse(fs.readFileSync(path.join(root, 'src/data/videos.json'), 'utf8'));
const videoPage = fs.readFileSync(path.join(dist, 'videos/index.html'), 'utf8');
assert.equal(videos.length, 14); assert.equal(new Set(videos.map(v => v.id)).size, 14);
videos.forEach(video => assert.equal((videoPage.match(new RegExp(`data-video-id="${video.id}"`, 'g')) ?? []).length, 1, `Video once: ${video.id}`));
report.videos = videos.length; report.externalImageHosts = [...imageHosts];
assert(report.posts.length >= 8, 'The initial eight published articles must remain available');
assert.equal(new Set(report.posts.map(post => post.category)).size, 8, 'One initial article per category');
const output = path.join(root, '../docs/validation/build-report.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${report.htmlPages} HTML pages; ${report.posts.length} articles (700–1000 words); ${report.videos} unique videos; ${report.internalLinks} valid internal links; RSS, sitemap, SEO, sources and lazy players.`);
