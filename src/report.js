import { reportData } from './report-data.js';

const $ = (selector) => document.querySelector(selector);

function list(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function renderMetrics() {
  $('#metrics-grid').innerHTML = reportData.metrics.map((metric) => `
    <article class="metric">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
      <p>${metric.detail}</p>
    </article>
  `).join('');
}

function renderLane(selector, lane, mode) {
  const details = mode === 'codex'
    ? [
      ['Folder', lane.folder],
      ['Branch', lane.branch],
      ['Remote', lane.remote],
      ['App', `<a href="${lane.appUrl}">${lane.appUrl}</a>`],
      ['Impl commit', lane.latestImplementationCommit],
      ['Tracker', lane.latestTrackingCommit],
    ]
    : [
      ['Folder', lane.folder],
      ['Branch', lane.branch],
      ['Remote', `<a href="${lane.remote}">${lane.remote}</a>`],
      ['Live', `<a href="${lane.liveUrl}">${lane.liveUrl}</a>`],
      ['Local HEAD', lane.localHead],
      ['Remote HEAD', lane.remoteHead],
    ];

  const body = mode === 'codex'
    ? `<h3>${lane.currentStep} · Codex Lane</h3>${list(lane.strengths)}<h3>Open Items</h3>${list(lane.openItems)}`
    : `<h3>${lane.currentStep} · Claude Lane</h3>${list(lane.strengths)}<h3>Concerns</h3>${list(lane.concerns)}`;

  $(selector).innerHTML = `
    <dl>
      ${details.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}
    </dl>
    ${body}
  `;
}

function renderTimeline() {
  $('#timeline').innerHTML = reportData.timeline.map((item) => `
    <li>
      <div class="step">${item.step}</div>
      <div>
        <h3>${item.title}</h3>
        <time>${item.date}</time>
        <div class="timeline-grid">
          <div>
            <strong>Codex</strong>
            <p>${item.codex.join(' · ')}</p>
          </div>
          <div>
            <strong>Claude</strong>
            <p>${item.claude.join(' · ')}</p>
          </div>
        </div>
      </div>
    </li>
  `).join('');
}

function renderLists() {
  $('#verification-list').innerHTML = list(reportData.verification);
  $('#risk-list').innerHTML = list(reportData.redTeam);
}

function drawOrbitMap() {
  const canvas = $('#orbit-map');
  const context = canvas.getContext('2d');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint();
  }

  function paint() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    context.clearRect(0, 0, width, height);
    const cx = width * 0.68;
    const cy = height * 0.42;
    const max = Math.max(width, height);

    context.save();
    context.translate(cx, cy);
    context.rotate(-0.18);
    for (let i = 1; i <= 8; i += 1) {
      context.beginPath();
      context.ellipse(0, 0, max * (0.08 + i * 0.043), max * (0.032 + i * 0.017), 0, 0, Math.PI * 2);
      context.strokeStyle = `rgba(190,210,240,${0.07 + i * 0.008})`;
      context.lineWidth = 1;
      context.stroke();
    }
    context.restore();

    const bodies = [
      [cx, cy, 14, 'rgba(255,198,95,0.95)'],
      [cx + max * 0.2, cy - max * 0.02, 4, 'rgba(120,220,228,0.82)'],
      [cx - max * 0.18, cy + max * 0.06, 6, 'rgba(125,180,255,0.88)'],
      [cx + max * 0.35, cy + max * 0.04, 8, 'rgba(216,189,130,0.9)'],
    ];

    for (const [x, y, r, color] of bodies) {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fillStyle = color;
      context.shadowBlur = r * 2.2;
      context.shadowColor = color;
      context.fill();
    }
    context.shadowBlur = 0;
  }

  window.addEventListener('resize', resize);
  resize();
}

function init() {
  $('#codex-step').textContent = reportData.codex.currentStep;
  $('#claude-step').textContent = reportData.claude.currentStep;
  $('#last-sync').textContent = reportData.generatedAt;
  renderMetrics();
  renderLane('#codex-lane', reportData.codex, 'codex');
  renderLane('#claude-lane', reportData.claude, 'claude');
  renderTimeline();
  renderLists();
  drawOrbitMap();
}

init();
