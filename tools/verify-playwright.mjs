import { chromium } from 'playwright';
import path from 'node:path';

const url = process.env.SOLAR_PROJECT_URL || 'http://127.0.0.1:5178/';
const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function inspectViewport(browser, viewport) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
  });
  const messages = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.__SOLAR_READY === true, null, { timeout: 45000 });
  await page.waitForTimeout(600);

  const screenshotPath = path.join('internal', 'notes', 'verification', `step1-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const loading = document.getElementById('loading');
    const hud = document.querySelector('.hud')?.getBoundingClientRect();
    const toolbar = document.querySelector('.toolbar')?.getBoundingClientRect();
    const copy = document.createElement('canvas');
    copy.width = 160;
    copy.height = 100;
    const context = copy.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, copy.width, copy.height);
    const data = context.getImageData(0, 0, copy.width, copy.height).data;
    let litPixels = 0;
    const colorBuckets = new Set();

    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const total = red + green + blue;
      if (total > 24) litPixels += 1;
      if (total > 60) colorBuckets.add(`${red >> 4},${green >> 4},${blue >> 4}`);
    }

    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      litRatio: litPixels / (data.length / 4),
      colorBucketCount: colorBuckets.size,
      loadingHidden: loading?.classList.contains('is-hidden') ?? false,
      hud: hud ? { width: hud.width, height: hud.height, top: hud.top, left: hud.left } : null,
      toolbar: toolbar ? { width: toolbar.width, height: toolbar.height, bottom: innerHeight - toolbar.bottom, left: toolbar.left } : null,
    };
  });

  await page.close();
  return { viewport: viewport.name, screenshotPath, messages, metrics };
}

function assertResult(result) {
  if (result.messages.length) {
    throw new Error(`${result.viewport} console output: ${result.messages.join(' | ')}`);
  }
  if (!result.metrics.loadingHidden) {
    throw new Error(`${result.viewport} loading overlay did not hide`);
  }
  if (result.metrics.litRatio < 0.005) {
    throw new Error(`${result.viewport} canvas appears blank: ${JSON.stringify(result.metrics)}`);
  }
  if (result.metrics.colorBucketCount < 12) {
    throw new Error(`${result.viewport} canvas has too little color variation: ${JSON.stringify(result.metrics)}`);
  }
}

const browser = await launchBrowser();
const results = [];
try {
  for (const viewport of viewports) {
    const result = await inspectViewport(browser, viewport);
    assertResult(result);
    results.push(result);
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
