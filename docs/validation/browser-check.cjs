// Local runtime acceptance check; no dependency or browser download.
// Override these two environment variables to use a different local installation.
const { chromium } = require(process.env.CL_PLAYWRIGHT_PATH || 'C:/Users/tharc/Documents/NardotoStudio/node_modules/playwright-core');
const executablePath = process.env.CL_CHROMIUM_PATH || 'C:/Users/tharc/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../site/dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.join(root, pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.statusCode = 404; file = path.join(root, '404.html'); }
  res.setHeader('Content-Type', `${mime[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`);
  fs.createReadStream(file).pipe(res);
});
const report = { checks: [], pageErrors: [], localErrors: [], externalFailures: [], screenshots: [] };
const check = (name, passed, details) => { report.checks.push({ name, passed: Boolean(passed), details }); };
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) (response.url().startsWith(origin) ? report.localErrors : report.externalFailures).push({ url: response.url(), status: response.status() }); });
  const routes = files(root).filter(f => f.endsWith('index.html')).map(f => '/' + path.relative(root, f).replaceAll('\\', '/').replace(/index.html$/, ''));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: 'load' });
      const dimensions = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, h1: document.querySelectorAll('h1').length, background: getComputedStyle(document.body).backgroundColor }));
      check(`${width}px ${route}`, !dimensions.overflow && dimensions.h1 === 1, dimensions);
    }
    for (const [route, name] of [['/', 'home'], ['/guide/', 'guide'], ['/blog/hayward-fault-without-the-countdown/', 'article']]) {
      await page.goto(origin + route, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const filename = `${name}-${width}.png`;
      await page.screenshot({ path: path.join(__dirname, filename), fullPage: true });
      report.screenshots.push(filename);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/', { waitUntil: 'load' });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  check('Mobile menu initially collapsed', await menu.getAttribute('aria-expanded') === 'false' && !(await page.locator('#primary-nav').isVisible()));
  await menu.click(); check('Mobile menu opens', await page.locator('#primary-nav').isVisible());
  await page.keyboard.press('Escape'); check('Escape closes menu and restores focus', await menu.getAttribute('aria-expanded') === 'false' && await menu.evaluate(e => e === document.activeElement));
  await menu.click(); await page.setViewportSize({ width: 1440, height: 1000 });
  check('Desktop navigation survives resizing', await page.locator('#primary-nav').isVisible());
  await page.goto(origin + '/guide/');
  const faq = page.locator('.faq-item').nth(1); await faq.locator('summary').focus(); await page.keyboard.press('Enter');
  check('Native FAQ works with keyboard', await faq.getAttribute('open') !== null);
  check('Guide purchase goes to Payhip', await page.locator('.button-checkout').getAttribute('href') === 'https://payhip.com/b/GWENV');
  await page.goto(origin + '/blog/hayward-fault-without-the-countdown/');
  check('Player has no initial iframe', await page.locator('iframe').count() === 0);
  // Isolate third-party availability: assert the generated iframe URL after keyboard activation.
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Embed request observed</title>' }));
  const trigger = page.getByRole('button', { name: /^Play video:/ }); await trigger.focus(); await page.keyboard.press('Enter');
  await page.locator('iframe').waitFor();
  check('Player creates privacy-enhanced iframe on keyboard activation', (await page.locator('iframe').getAttribute('src')).includes('youtube-nocookie.com/embed/g2595F_iCFA?autoplay=1'));
  const typography = await page.locator('.prose').evaluate(e => ({ font: getComputedStyle(e).fontSize, lineHeight: getComputedStyle(e).lineHeight, width: e.getBoundingClientRect().width }));
  check('Comfortable article typography', typography.font === '18px' && typography.lineHeight === '29.7px', typography);
  const numbers = await page.locator('.toc a').evaluateAll(links => links.every(a => document.getElementById(a.hash.slice(1))));
  check('Every generated TOC target exists', numbers);
  const imageState = await page.locator('img').evaluateAll(images => images.map(img => ({ src: img.src, loaded: img.complete && img.naturalWidth > 0 })));
  report.imageState = imageState;
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await nojs.newPage(); await staticPage.goto(origin + '/blog/hayward-fault-without-the-countdown/');
  check('Without JS: navigation stays visible', await staticPage.locator('#primary-nav').isVisible());
  check('Without JS: player becomes YouTube link', await staticPage.locator('a.video-trigger').getAttribute('href') === 'https://www.youtube.com/watch?v=g2595F_iCFA');
  check('Without JS: content remains readable', await staticPage.locator('.prose h2').count() > 0);
  // Check theme pairings against WCAG normal-text contrast.
  const lum = hex => { const rgb = hex.match(/[\da-f]{2}/gi).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; };
  for (const [fg, bg] of [['C9D3DF', '16304D'], ['E8A33D', '16304D'], ['1B2A3A', 'F3EFE6'], ['52606B', 'F3EFE6'], ['825011', 'F3EFE6'], ['FFFFFF', 'B5352E'], ['0F2137', 'E8A33D']]) {
    const a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    check(`Contrast #${fg} on #${bg}`, ratio >= 4.5, ratio.toFixed(2));
  }
  check('No browser script errors', report.pageErrors.length === 0, report.pageErrors);
  check('No broken local requests', report.localErrors.length === 0, report.localErrors);
  fs.writeFileSync(path.join(__dirname, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  const failed = report.checks.filter(c => !c.passed);
  console.log(JSON.stringify({ passed: report.checks.length - failed.length, failed, externalFailures: report.externalFailures, screenshots: report.screenshots }, null, 2));
  assert.equal(failed.length, 0, 'Runtime checks failed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
