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

  const screenshotPath = path.join('internal', 'notes', 'verification', `step4-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const loading = document.getElementById('loading');
    const hud = document.querySelector('.hud')?.getBoundingClientRect();
    const toolbar = document.querySelector('.toolbar')?.getBoundingClientRect();
    const timebar = document.querySelector('.timebar')?.getBoundingClientRect();
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
      planetCount: Object.keys(window.solarProject.computeState(new Date()).planets).length,
      focusOptionCount: document.querySelectorAll('#focus-target option').length,
      hasTimeInput: document.getElementById('time-input') instanceof HTMLInputElement,
      hasTimeRange: document.getElementById('time-range') instanceof HTMLInputElement,
      dateLabel: document.getElementById('readout-date')?.textContent,
      jumpButtonCount: document.querySelectorAll('[data-time-jump]').length,
      speedPresetCount: document.querySelectorAll('[data-speed]').length,
      hud: hud ? { width: hud.width, height: hud.height, top: hud.top, left: hud.left } : null,
      toolbar: toolbar ? { width: toolbar.width, height: toolbar.height, bottom: innerHeight - toolbar.bottom, left: toolbar.left } : null,
      timebar: timebar ? { width: timebar.width, height: timebar.height, bottom: innerHeight - timebar.bottom, left: timebar.left } : null,
    };
  });

  await page.selectOption('#focus-target', 'saturn');
  await page.waitForTimeout(180);
  await page.click('#scale-mode');
  await page.waitForTimeout(180);
  await page.click('[data-speed="100"]');
  await page.waitForTimeout(180);
  const speedPresetText = await page.evaluate(() => document.getElementById('readout-speed').textContent);
  await page.click('[data-speed="1"]');
  await page.waitForTimeout(120);
  await page.selectOption('#focus-target', 'neptune');
  await page.waitForTimeout(180);
  await page.click('#time-reset');
  await page.waitForTimeout(180);
  const resetDateLabel = await page.evaluate(() => window.solarProject.getSimulationDateLabel());
  await page.click('[data-time-jump="+7d"]');
  await page.waitForTimeout(180);
  const weekForwardLabel = await page.evaluate(() => window.solarProject.getSimulationDateLabel());
  await page.evaluate(() => {
    const input = document.getElementById('time-input');
    input.value = '2026-03-04T05:06:07';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(180);
  const inputIso = await page.evaluate(() => window.solarProject.getSimulationDate());
  await page.click('#time-forward-day');
  await page.waitForTimeout(180);
  const forwardIso = await page.evaluate(() => window.solarProject.getSimulationDate());
  await page.evaluate(() => {
    const range = document.getElementById('time-range');
    range.value = '2';
    range.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(180);
  const rangeIso = await page.evaluate(() => window.solarProject.getSimulationDate());
  await page.evaluate(() => window.solarProject.setScaleMode('visual'));
  await page.evaluate(() => window.solarProject.setFocusMode('earth'));
  await page.waitForTimeout(1100);
  const earthScreen = await page.evaluate(() => window.solarProject.getBodyScreenPosition('earth'));
  await page.evaluate(() => {
    document.getElementById('info-panel').hidden = true;
  });
  if (earthScreen.visible) {
    await page.mouse.click(earthScreen.x, earthScreen.y);
  } else {
    await page.evaluate(() => window.solarProject.focusBody('earth'));
  }
  await page.waitForTimeout(1100);
  const focusPanel = await page.evaluate(() => ({
    title: document.getElementById('info-title').textContent,
    hidden: document.getElementById('info-panel').hidden,
    focusValue: document.getElementById('focus-target').value,
  }));
  await page.click('#overview');
  await page.waitForTimeout(700);
  const overviewState = await page.evaluate(() => ({
    hidden: document.getElementById('info-panel').hidden,
    focusValue: document.getElementById('focus-target').value,
  }));
  await page.click('#time-live');
  await page.waitForTimeout(180);
  const interaction = await page.evaluate(() => ({
    focusValue: document.getElementById('focus-target').value,
    scaleText: document.getElementById('scale-mode').textContent,
    liveSpeedText: document.getElementById('readout-speed').textContent,
    inputValue: document.getElementById('time-input').value,
    liveDeltaMs: Math.abs(Date.parse(window.solarProject.getSimulationDate()) - Date.now()),
    ready: window.__SOLAR_READY === true,
  }));
  interaction.resetDateLabel = resetDateLabel;
  interaction.weekForwardLabel = weekForwardLabel;
  interaction.speedPresetText = speedPresetText;
  interaction.focusPanel = focusPanel;
  interaction.overviewState = overviewState;
  interaction.forwardDeltaMs = Date.parse(forwardIso) - Date.parse(inputIso);
  interaction.rangeDeltaMs = Date.parse(rangeIso) - Date.parse(inputIso);

  await page.close();
  return { viewport: viewport.name, screenshotPath, messages, metrics, interaction };
}

function assertResult(result) {
  if (result.messages.length) {
    throw new Error(`${result.viewport} console output: ${result.messages.join(' | ')}`);
  }
  if (!result.metrics.loadingHidden) {
    throw new Error(`${result.viewport} loading overlay did not hide`);
  }
  if (result.metrics.planetCount !== 7) {
    throw new Error(`${result.viewport} expected 7 major planets beyond Earth, got ${result.metrics.planetCount}`);
  }
  if (result.metrics.focusOptionCount !== 10) {
    throw new Error(`${result.viewport} expected 10 focus options, got ${result.metrics.focusOptionCount}`);
  }
  if (!result.metrics.hasTimeInput || !result.metrics.hasTimeRange) {
    throw new Error(`${result.viewport} expected date input and time range controls`);
  }
  if (result.metrics.jumpButtonCount !== 10 || result.metrics.speedPresetCount !== 3) {
    throw new Error(`${result.viewport} expected jump buttons and speed presets: ${JSON.stringify(result.metrics)}`);
  }
  if (result.interaction.focusValue !== 'sun' || result.interaction.scaleText !== 'Visual' || !result.interaction.ready) {
    throw new Error(`${result.viewport} focus/scale interaction failed: ${JSON.stringify(result.interaction)}`);
  }
  if (result.interaction.speedPresetText !== '100x' || result.interaction.liveSpeedText !== '1x') {
    throw new Error(`${result.viewport} 100x speed preset failed: ${JSON.stringify(result.interaction)}`);
  }
  if (result.interaction.resetDateLabel !== '2026-05-22' || result.interaction.weekForwardLabel !== '2026-05-29') {
    throw new Error(`${result.viewport} date jump/reset failed: ${JSON.stringify(result.interaction)}`);
  }
  if (result.interaction.focusPanel.hidden || result.interaction.focusPanel.title !== 'Earth' || result.interaction.focusPanel.focusValue !== 'earth') {
    throw new Error(`${result.viewport} click focus/info panel failed: ${JSON.stringify(result.interaction.focusPanel)}`);
  }
  if (!result.interaction.overviewState.hidden || result.interaction.overviewState.focusValue !== 'sun') {
    throw new Error(`${result.viewport} overview return failed: ${JSON.stringify(result.interaction.overviewState)}`);
  }
  if (Math.abs(result.interaction.forwardDeltaMs - 86400000) > 1000) {
    throw new Error(`${result.viewport} +1d interaction failed: ${JSON.stringify(result.interaction)}`);
  }
  if (Math.abs(result.interaction.rangeDeltaMs - 259200000) > 1000) {
    throw new Error(`${result.viewport} range interaction failed: ${JSON.stringify(result.interaction)}`);
  }
  if (result.interaction.liveDeltaMs > 5000) {
    throw new Error(`${result.viewport} live interaction failed: ${JSON.stringify(result.interaction)}`);
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
