// Local acceptance check. Uses an existing Playwright installation; no download/build.
const { chromium } = require('C:/Users/tharc/Documents/NardotoStudio/node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const project = path.resolve(__dirname, '../..');
const output = __dirname;
const report = { checkedAt: new Date().toISOString(), protocol: 'file://', checks: [], viewports: [], consoleErrors: [], pageErrors: [], failedRequests: [], requests: [] };
function check(name, passed, details) { report.checks.push({ name, passed: Boolean(passed), ...(details ? { details } : {}) }); }

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/tharc/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe',
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('request', request => { if (/^https?:/.test(request.url())) report.requests.push(request.url()); });
    await page.goto(pathToFileURL(path.join(project, 'index.html')).href, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);

    const structure = await page.evaluate(() => ({
      sections: document.querySelectorAll('main > section').length,
      header: Boolean(document.querySelector('body > header')),
      footer: Boolean(document.querySelector('body > footer')),
      h1: document.querySelectorAll('h1').length,
      questions: document.querySelectorAll('.faq-item').length,
      prices: [...document.querySelectorAll('.product-price')].map(e => e.textContent),
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))),
      imagesHaveAlt: [...document.images].every(img => img.hasAttribute('alt') && img.complete && img.naturalWidth > 0),
      fonts: { oswald: document.fonts.check('700 24px Oswald'), inter: document.fonts.check('400 16px Inter') },
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      checklist: [...document.querySelectorAll('.sample-page .checklist li')].map(item => item.textContent),
      reducedMotion: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    report.structure = structure;
    check('All ten sections (header + 8 main sections + footer)', structure.sections === 8 && structure.header && structure.footer);
    check('One main heading and five FAQ questions', structure.h1 === 1 && structure.questions === 5);
    check('Two editable price placeholders', structure.prices.length === 2 && structure.prices.every(p => p === '$XX'));
    check('Internal anchors resolve', structure.missingAnchors.length === 0, structure.missingAnchors);
    check('Local logo images load and have alt attributes', structure.imagesHaveAlt);
    check('Both requested fonts load', structure.fonts.oswald && structure.fonts.inter);
    check('Eleven reference checklist entries', structure.checklist.length === 11);
    check('Reduced-motion preference respected', structure.reducedMotion === 'auto');

    report.contrast = await page.evaluate(() => {
      const properties = getComputedStyle(document.documentElement);
      const luminance = property => {
        const hex = properties.getPropertyValue(property).trim();
        const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
          .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      return [['--white', '--navy'], ['--muted', '--navy-card'], ['--navy', '--gold'], ['--white', '--red'], ['--ink', '--paper'], ['--paper-muted', '--paper'], ['--gold-ink', '--paper'], ['--gold', '--navy-deep']].map(([foreground, background]) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return { foreground, background, ratio: +((values[0] + .05) / (values[1] + .05)).toFixed(2) };
      });
    });
    check('Core text color pairs meet AA (4.5:1)', report.contrast.every(pair => pair.ratio >= 4.5), report.contrast);

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        overflowing: [...document.querySelectorAll('body *')].filter(el => {
          const box = el.getBoundingClientRect();
          return box.width && (box.left < -1 || box.right > innerWidth + 1) && !el.closest('.product-scene') && !el.closest('.icon-definitions') && !el.classList.contains('skip-link');
        }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0, 60) })),
      }));
      report.viewports.push(metrics);
      check(`No horizontal overflow at ${width}px`, metrics.documentWidth === width && metrics.overflowing.length === 0, metrics.overflowing);
      await page.screenshot({ path: path.join(output, `desktop-${width}.png`.replace('desktop-390', 'mobile-390')), fullPage: true });
      await page.screenshot({ path: path.join(output, `viewport-${width}.png`) });
      if (width === 1440) await page.locator('#preview').screenshot({ path: path.join(output, 'preview-1440.png') });
    }

    await page.locator('.menu-toggle').click();
    check('Mobile menu opens', await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'true' && await page.locator('#primary-nav').isVisible());
    await page.keyboard.press('Escape');
    check('Escape closes menu and restores focus', await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'false' && await page.locator('.menu-toggle').evaluate(el => document.activeElement === el));
    await page.locator('.menu-toggle').click();
    await page.locator('#primary-nav a[href="#inside"]').click();
    check('Mobile navigation scrolls and closes', page.url().endsWith('#inside') && await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'false');

    await page.locator('.faq-item').nth(1).locator('summary').click();
    await page.waitForFunction(() => document.querySelectorAll('.faq-item[open]').length === 1 && document.querySelectorAll('.faq-item')[1].open);
    check('FAQ opens one answer at a time', await page.locator('.faq-item[open]').count() === 1);
    await page.locator('.faq-item').nth(2).locator('summary').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('.faq-item')[2].open && document.querySelectorAll('.faq-item[open]').length === 1);
    check('FAQ supports keyboard activation', await page.locator('.faq-item').nth(2).getAttribute('open') !== null);
    check('Visible focus indicator', await page.locator('.faq-item').nth(2).locator('summary').evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));

    await page.locator('.button-checkout').click();
    check('Checkout placeholder has an honest local notice', await page.locator('#CHECKOUT_URL').isVisible());
    for (const id of ['privacy', 'terms', 'contact']) {
      await page.locator(`.footer-top nav a[href="#${id}"]`).click();
      check(`${id} footer link works`, await page.locator(`#${id}`).isVisible());
    }

    const offline = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, reducedMotion: 'reduce' });
    await offline.route('https://**/*', route => route.abort());
    const noJsPage = await offline.newPage();
    await noJsPage.goto(pathToFileURL(path.join(project, 'index.html')).href, { waitUntil: 'load' });
    check('No-JS navigation remains visible', await noJsPage.locator('#primary-nav').isVisible());
    await noJsPage.locator('.faq-item').nth(4).locator('summary').click();
    check('No-JS FAQ remains functional', await noJsPage.locator('.faq-item').nth(4).getAttribute('open') !== null);
    check('Offline fallback fits mobile', await noJsPage.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await offline.close();

    check('No page errors', report.pageErrors.length === 0, report.pageErrors);
    check('No console errors', report.consoleErrors.length === 0, report.consoleErrors);
    check('Only Google Fonts requested externally', report.requests.every(url => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)), report.requests);
    await context.close();
  } catch (error) {
    report.fatalError = error.stack;
  } finally {
    await browser.close();
    report.passed = !report.fatalError && report.checks.every(item => item.passed);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.passed ? 0 : 1;
  }
})();
