import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const DAY_MS = 86400000;
const AU_KM = 149_597_870.7;
const EARTH_RADIUS_KM = 6_371.0;
const SUN_RADIUS_KM = 696_340.0;
const MOON_RADIUS_KM = 1_737.4;
const OBLIQUITY_DEG = 23.4392911;
const EPOCH_2000_JAN_0 = Date.UTC(1999, 11, 31, 0, 0, 0);

const SCALES = {
  visual: {
    label: 'Visual',
    au: 86,
    sunRadius: 6.2,
    earthRadius: 1.35,
    moonRadius: 0.38,
    moonDistancePerEarthRadius: 0.155,
    sunGlow: 22,
    earthGlow: 2.25,
  },
  real: {
    label: 'True',
    au: 86,
    sunRadius: (SUN_RADIUS_KM / AU_KM) * 86,
    earthRadius: (EARTH_RADIUS_KM / AU_KM) * 86,
    moonRadius: (MOON_RADIUS_KM / AU_KM) * 86,
    moonDistancePerEarthRadius: (EARTH_RADIUS_KM / AU_KM) * 86,
    sunGlow: 1.1,
    earthGlow: 0.018,
  },
};

const SPEEDS = [-604800, -86400, -21600, -3600, -600, -60, -10, -1, 1, 10, 60, 600, 3600, 21600, 86400, 604800];

const readouts = {
  local: document.getElementById('readout-local'),
  utc: document.getElementById('readout-utc'),
  speed: document.getElementById('readout-speed'),
  gmst: document.getElementById('readout-gmst'),
  phase: document.getElementById('readout-phase'),
  moonDistance: document.getElementById('readout-moon-distance'),
  sunDistance: document.getElementById('readout-sun-distance'),
};

const buttons = {
  speedDown: document.getElementById('speed-down'),
  pause: document.getElementById('pause'),
  speedUp: document.getElementById('speed-up'),
  now: document.getElementById('now'),
  focusEarth: document.getElementById('focus-earth'),
  focusSun: document.getElementById('focus-sun'),
  scaleMode: document.getElementById('scale-mode'),
  toggleOrbits: document.getElementById('toggle-orbits'),
};

const loading = document.getElementById('loading');
const localFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

const rev = (value) => {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const sinDeg = (value) => Math.sin(value * DEG);
const cosDeg = (value) => Math.cos(value * DEG);
const atan2Deg = (y, x) => Math.atan2(y, x) * RAD;

function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function daysSinceEpoch(date) {
  return (date.getTime() - EPOCH_2000_JAN_0) / DAY_MS;
}

function julianDate(date) {
  return date.getTime() / DAY_MS + 2440587.5;
}

function toSceneVector(x, y, z) {
  return new THREE.Vector3(x, z, -y);
}

function solveKepler(meanAnomalyDeg, eccentricity) {
  let eccentricAnomaly = meanAnomalyDeg + RAD * eccentricity * sinDeg(meanAnomalyDeg) * (1 + eccentricity * cosDeg(meanAnomalyDeg));
  for (let i = 0; i < 8; i += 1) {
    const delta = (eccentricAnomaly - RAD * eccentricity * sinDeg(eccentricAnomaly) - meanAnomalyDeg)
      / (1 - eccentricity * cosDeg(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }
  return eccentricAnomaly;
}

function solarElements(days) {
  const perihelion = rev(282.9404 + 4.70935e-5 * days);
  const eccentricity = 0.016709 - 1.151e-9 * days;
  const meanAnomaly = rev(356.0470 + 0.9856002585 * days);
  const eccentricAnomaly = meanAnomaly + RAD * eccentricity * sinDeg(meanAnomaly) * (1 + eccentricity * cosDeg(meanAnomaly));
  const x = cosDeg(eccentricAnomaly) - eccentricity;
  const y = Math.sqrt(1 - eccentricity * eccentricity) * sinDeg(eccentricAnomaly);
  const trueAnomaly = atan2Deg(y, x);
  const radiusAu = Math.sqrt(x * x + y * y);

  return {
    longitude: rev(trueAnomaly + perihelion),
    radiusAu,
    meanAnomaly,
    meanLongitude: rev(meanAnomaly + perihelion),
  };
}

function lunarElements(days, sun) {
  const node = rev(125.1228 - 0.0529538083 * days);
  const inclination = 5.1454;
  const periapsis = rev(318.0634 + 0.1643573223 * days);
  const semiMajorAxisEarthRadii = 60.2666;
  const eccentricity = 0.0549;
  const meanAnomaly = rev(115.3654 + 13.0649929509 * days);
  const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);
  const xv = semiMajorAxisEarthRadii * (cosDeg(eccentricAnomaly) - eccentricity);
  const yv = semiMajorAxisEarthRadii * Math.sqrt(1 - eccentricity * eccentricity) * sinDeg(eccentricAnomaly);
  const trueAnomaly = atan2Deg(yv, xv);
  const radiusEarthRadii = Math.sqrt(xv * xv + yv * yv);

  const xh = radiusEarthRadii * (cosDeg(node) * cosDeg(trueAnomaly + periapsis)
    - sinDeg(node) * sinDeg(trueAnomaly + periapsis) * cosDeg(inclination));
  const yh = radiusEarthRadii * (sinDeg(node) * cosDeg(trueAnomaly + periapsis)
    + cosDeg(node) * sinDeg(trueAnomaly + periapsis) * cosDeg(inclination));
  const zh = radiusEarthRadii * (sinDeg(trueAnomaly + periapsis) * sinDeg(inclination));

  let longitude = atan2Deg(yh, xh);
  let latitude = atan2Deg(zh, Math.sqrt(xh * xh + yh * yh));

  const lunarMeanLongitude = rev(node + periapsis + meanAnomaly);
  const elongation = rev(lunarMeanLongitude - sun.meanLongitude);
  const argumentOfLatitude = rev(lunarMeanLongitude - node);

  longitude += -1.274 * sinDeg(meanAnomaly - 2 * elongation)
    + 0.658 * sinDeg(2 * elongation)
    - 0.186 * sinDeg(sun.meanAnomaly)
    - 0.059 * sinDeg(2 * meanAnomaly - 2 * elongation)
    - 0.057 * sinDeg(meanAnomaly - 2 * elongation + sun.meanAnomaly)
    + 0.053 * sinDeg(meanAnomaly + 2 * elongation)
    + 0.046 * sinDeg(2 * elongation - sun.meanAnomaly)
    + 0.041 * sinDeg(meanAnomaly - sun.meanAnomaly)
    - 0.035 * sinDeg(elongation)
    - 0.031 * sinDeg(meanAnomaly + sun.meanAnomaly)
    - 0.015 * sinDeg(2 * argumentOfLatitude - 2 * elongation)
    + 0.011 * sinDeg(meanAnomaly - 4 * elongation);

  latitude += -0.173 * sinDeg(argumentOfLatitude - 2 * elongation)
    - 0.055 * sinDeg(meanAnomaly - argumentOfLatitude - 2 * elongation)
    - 0.046 * sinDeg(meanAnomaly + argumentOfLatitude - 2 * elongation)
    + 0.033 * sinDeg(argumentOfLatitude + 2 * elongation)
    + 0.017 * sinDeg(2 * meanAnomaly + argumentOfLatitude);

  const correctedRadius = radiusEarthRadii
    - 0.58 * cosDeg(meanAnomaly - 2 * elongation)
    - 0.46 * cosDeg(2 * elongation);

  return {
    longitude: rev(longitude),
    latitude,
    radiusEarthRadii: correctedRadius,
    vectorEarthRadii: toSceneVector(
      correctedRadius * cosDeg(longitude) * cosDeg(latitude),
      correctedRadius * sinDeg(longitude) * cosDeg(latitude),
      correctedRadius * sinDeg(latitude),
    ),
  };
}

function gmstDegrees(date) {
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525;
  return rev(280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * t * t
    - (t * t * t) / 38710000);
}

function computeState(date) {
  const days = daysSinceEpoch(date);
  const sun = solarElements(days);
  const moon = lunarElements(days, sun);
  const sunVectorAu = toSceneVector(
    sun.radiusAu * cosDeg(sun.longitude),
    sun.radiusAu * sinDeg(sun.longitude),
    0,
  );
  const earthVectorAu = sunVectorAu.clone().multiplyScalar(-1);
  const phaseAngle = rev(moon.longitude - sun.longitude);
  const illumination = (1 - cosDeg(phaseAngle)) / 2;

  return {
    date,
    sun,
    moon,
    earthVectorAu,
    gmst: gmstDegrees(date),
    phaseAngle,
    illumination,
    earthSunKm: sun.radiusAu * AU_KM,
    earthMoonKm: moon.radiusEarthRadii * EARTH_RADIUS_KM,
  };
}

function moonPhaseName(angle) {
  if (angle < 22.5 || angle >= 337.5) return '삭';
  if (angle < 67.5) return '초승';
  if (angle < 112.5) return '상현';
  if (angle < 157.5) return '차오름';
  if (angle < 202.5) return '보름';
  if (angle < 247.5) return '기울음';
  if (angle < 292.5) return '하현';
  return '그믐';
}

function canvasTexture(width, height, painter) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  painter(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeSunTexture() {
  const rand = seededRandom(1001);
  return canvasTexture(1024, 512, (ctx, width, height) => {
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, '#ffae42');
    base.addColorStop(0.48, '#ff6c12');
    base.addColorStop(1, '#ffcf70');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 320; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const radius = 8 + rand() * 52;
      const hot = rand() > 0.48 ? '255,236,145' : '208,56,10';
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(${hot},0.56)`);
      glow.addColorStop(1, `rgba(${hot},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeEarthTexture() {
  const rand = seededRandom(2024);
  return canvasTexture(2048, 1024, (ctx, width, height) => {
    const ocean = ctx.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, '#08204f');
    ocean.addColorStop(0.5, '#14599e');
    ocean.addColorStop(1, '#081c48');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, width, height);

    const landColors = ['#2b6b3b', '#4f8845', '#7f8544', '#9a7a42', '#356f47'];
    for (let mass = 0; mass < 16; mass += 1) {
      const centerX = rand() * width;
      const centerY = height * (0.18 + rand() * 0.64);
      const blobs = 18 + Math.floor(rand() * 20);
      for (let i = 0; i < blobs; i += 1) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * 140;
        const rx = 22 + rand() * 88;
        const ry = 16 + rand() * 62;
        ctx.fillStyle = landColors[Math.floor(rand() * landColors.length)];
        ctx.beginPath();
        ctx.ellipse(
          centerX + Math.cos(angle) * dist,
          centerY + Math.sin(angle) * dist * 0.72,
          rx,
          ry,
          rand() * Math.PI,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(245,248,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(width / 2, 0, width * 0.58, 72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width / 2, height, width * 0.72, 88, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 70; i += 1) {
      ctx.beginPath();
      ctx.ellipse(rand() * width, rand() * height, 28 + rand() * 100, 8 + rand() * 22, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeMoonTexture() {
  const rand = seededRandom(3021);
  return canvasTexture(1024, 512, (ctx, width, height) => {
    ctx.fillStyle = '#a8a49a';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 9; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const radius = 42 + rand() * 95;
      const mare = ctx.createRadialGradient(x, y, 0, x, y, radius);
      mare.addColorStop(0, 'rgba(73,72,69,0.72)');
      mare.addColorStop(1, 'rgba(73,72,69,0)');
      ctx.fillStyle = mare;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 120; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const radius = 2 + rand() * 14;
      ctx.fillStyle = 'rgba(91,89,84,0.58)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(232,228,218,0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function makeGlowTexture() {
  return canvasTexture(256, 256, (ctx, width, height) => {
    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    glow.addColorStop(0, 'rgba(255,235,174,0.9)');
    glow.addColorStop(0.24, 'rgba(255,191,91,0.36)');
    glow.addColorStop(0.62, 'rgba(255,117,38,0.12)');
    glow.addColorStop(1, 'rgba(255,117,38,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  });
}

function makeLabelTexture(text) {
  return canvasTexture(256, 96, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5,8,14,0.58)';
    ctx.strokeStyle = 'rgba(214,228,255,0.32)';
    ctx.lineWidth = 2;
    ctx.roundRect(18, 20, 220, 48, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f7fbff';
    ctx.font = '600 24px Malgun Gothic, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, 44);
  });
}

function makeStarField() {
  const rand = seededRandom(4040);
  const count = 11000;
  const radius = 13000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const ring = Math.sqrt(1 - u * u);
    const index = i * 3;
    positions[index] = radius * ring * Math.cos(theta);
    positions[index + 1] = radius * u;
    positions[index + 2] = radius * ring * Math.sin(theta);

    const brightness = 0.52 + rand() * 0.48;
    const tint = rand();
    colors[index] = tint < 0.18 ? brightness : brightness * 0.82;
    colors[index + 1] = tint > 0.82 ? brightness * 0.84 : brightness;
    colors[index + 2] = tint < 0.18 ? brightness * 0.72 : brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 1.7,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
  }));
}

function makeOrbitLine(color, opacity) {
  return new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function setLinePoints(line, points) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
}

function makeLabel(text) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeLabelTexture(text),
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(7.2, 2.7, 1);
  sprite.userData.baseScale = sprite.scale.clone();
  return sprite;
}

function setLabelScalar(sprite, scalar) {
  sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(scalar);
}

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  logarithmicDepthBuffer: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.getElementById('app').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050a);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.0001, 60000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 0.004;
controls.maxDistance = 32000;
controls.rotateSpeed = 0.74;
controls.zoomSpeed = 0.86;

const sunLight = new THREE.PointLight(0xfff0d5, 3.6, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x4d5872, 0.28));
scene.add(makeStarField());

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 96, 64),
  new THREE.MeshBasicMaterial({ map: makeSunTexture() }),
);
scene.add(sunMesh);

const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture(),
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
scene.add(sunGlow);

const earthSystem = new THREE.Group();
scene.add(earthSystem);

const earthAxis = new THREE.Group();
earthAxis.rotation.z = -OBLIQUITY_DEG * DEG;
earthSystem.add(earthAxis);

const earthMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 96, 64),
  new THREE.MeshStandardMaterial({
    map: makeEarthTexture(),
    roughness: 0.92,
    metalness: 0,
    emissive: 0x071426,
    emissiveIntensity: 0.08,
  }),
);
earthAxis.add(earthMesh);

const earthAtmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 48),
  new THREE.MeshBasicMaterial({
    color: 0x75b7ff,
    transparent: true,
    opacity: 0.17,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
earthAxis.add(earthAtmosphere);

const earthAxisLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.72, 0), new THREE.Vector3(0, 1.72, 0)]),
  new THREE.LineBasicMaterial({ color: 0x88d6ff, transparent: true, opacity: 0.64 }),
);
earthAxis.add(earthAxisLine);

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 48),
  new THREE.MeshStandardMaterial({
    map: makeMoonTexture(),
    roughness: 1,
    metalness: 0,
  }),
);
scene.add(moonMesh);

const earthOrbit = makeOrbitLine(0x4e92d8, 0.42);
const moonOrbit = makeOrbitLine(0xd8d8e6, 0.38);
scene.add(earthOrbit);
scene.add(moonOrbit);

const labels = {
  sun: makeLabel('Sun'),
  earth: makeLabel('Earth'),
  moon: makeLabel('Moon'),
};
scene.add(labels.sun, labels.earth, labels.moon);

const markerGeometry = new THREE.RingGeometry(0.9, 1, 64);
const earthMarker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({
  color: 0x7db4ff,
  transparent: true,
  opacity: 0.38,
  side: THREE.DoubleSide,
}));
const moonMarker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({
  color: 0xd8d8e6,
  transparent: true,
  opacity: 0.34,
  side: THREE.DoubleSide,
}));
scene.add(earthMarker, moonMarker);

let scaleMode = 'visual';
let focusMode = 'earth';
let orbitsVisible = true;
let paused = false;
let speedIndex = SPEEDS.indexOf(1);
let simulationMs = Date.now();
let previousAnimationMs = performance.now();
let previousFocus = new THREE.Vector3();
let lastHudUpdate = 0;
let lastOrbitDayBucket = Number.NaN;
let firstFrameRendered = false;

function currentScale() {
  return SCALES[scaleMode];
}

function earthPositionUnits(state, scale) {
  return state.earthVectorAu.clone().multiplyScalar(scale.au);
}

function moonOffsetUnits(state, scale) {
  return state.moon.vectorEarthRadii.clone().multiplyScalar(scale.moonDistancePerEarthRadius);
}

function buildEarthOrbitPoints(centerDate) {
  const startDay = daysSinceEpoch(centerDate) - 182.6282;
  const points = [];
  const scale = currentScale();
  for (let i = 0; i < 512; i += 1) {
    const day = startDay + (365.2564 * i) / 512;
    const sun = solarElements(day);
    const sunVector = toSceneVector(sun.radiusAu * cosDeg(sun.longitude), sun.radiusAu * sinDeg(sun.longitude), 0);
    points.push(sunVector.multiplyScalar(-scale.au));
  }
  return points;
}

function buildMoonOrbitPoints(centerDate) {
  const startDay = daysSinceEpoch(centerDate) - 13.6608;
  const points = [];
  const scale = currentScale();
  for (let i = 0; i < 384; i += 1) {
    const day = startDay + (27.321661 * i) / 384;
    const sun = solarElements(day);
    const moon = lunarElements(day, sun);
    points.push(moon.vectorEarthRadii.clone().multiplyScalar(scale.moonDistancePerEarthRadius));
  }
  return points;
}

function rebuildOrbits(date, force = false) {
  const dayBucket = Math.floor(daysSinceEpoch(date) / 0.25);
  if (!force && dayBucket === lastOrbitDayBucket) return;
  lastOrbitDayBucket = dayBucket;
  setLinePoints(earthOrbit, buildEarthOrbitPoints(date));
  setLinePoints(moonOrbit, buildMoonOrbitPoints(date));
}

function applyScale() {
  const scale = currentScale();
  sunMesh.scale.setScalar(scale.sunRadius);
  sunGlow.scale.setScalar(scale.sunGlow);
  earthMesh.scale.setScalar(scale.earthRadius);
  earthAtmosphere.scale.setScalar(Math.max(scale.earthRadius * 1.18, scale.earthGlow));
  earthAxisLine.scale.setScalar(Math.max(scale.earthRadius, scale.earthGlow));
  moonMesh.scale.setScalar(scale.moonRadius);
  earthMarker.scale.setScalar(Math.max(scale.earthRadius * 1.62, scale.earthGlow * 1.15));
  moonMarker.scale.setScalar(Math.max(scale.moonRadius * 2.1, scale.earthGlow * 0.5));
  setLabelScalar(labels.sun, scaleMode === 'real' ? 0.75 : 1);
  setLabelScalar(labels.earth, scaleMode === 'real' ? 0.28 : 0.78);
  setLabelScalar(labels.moon, scaleMode === 'real' ? 0.24 : 0.58);
  buttons.scaleMode.textContent = scale.label;
  rebuildOrbits(new Date(simulationMs), true);
}

function setButtonStates() {
  buttons.pause.classList.toggle('is-active', paused);
  buttons.pause.textContent = paused ? 'Play' : 'Pause';
  buttons.focusEarth.classList.toggle('is-active', focusMode === 'earth');
  buttons.focusSun.classList.toggle('is-active', focusMode === 'sun');
  buttons.toggleOrbits.classList.toggle('is-active', orbitsVisible);
}

function frameFocus() {
  const state = computeState(new Date(simulationMs));
  const scale = currentScale();
  const earthPosition = earthPositionUnits(state, scale);
  const moonOffset = moonOffsetUnits(state, scale);
  const moonPosition = earthPosition.clone().add(moonOffset);

  if (focusMode === 'sun') {
    const distance = scale.au * 1.86;
    controls.target.set(0, 0, 0);
    camera.position.set(distance * 0.38, distance * 0.48, distance);
    previousFocus.set(0, 0, 0);
  } else {
    const earthToMoon = Math.max(moonOffset.length(), scale.earthRadius * 8, 0.16);
    controls.target.copy(earthPosition);
    camera.position.copy(earthPosition).add(new THREE.Vector3(earthToMoon * 0.7, earthToMoon * 0.48, earthToMoon * 1.42));
    previousFocus.copy(earthPosition);
  }

  camera.lookAt(controls.target);
  moonOrbit.position.copy(earthPosition);
  moonMesh.position.copy(moonPosition);
}

function updateScene(state) {
  const scale = currentScale();
  const earthPosition = earthPositionUnits(state, scale);
  const moonOffset = moonOffsetUnits(state, scale);
  const moonPosition = earthPosition.clone().add(moonOffset);
  const labelLift = Math.max(scale.earthRadius, scale.earthGlow);

  earthSystem.position.copy(earthPosition);
  moonMesh.position.copy(moonPosition);
  moonMesh.lookAt(earthPosition);
  earthMesh.rotation.y = -state.gmst * DEG;

  moonOrbit.position.copy(earthPosition);
  moonOrbit.visible = orbitsVisible;
  earthOrbit.visible = orbitsVisible;

  labels.sun.position.set(0, scale.sunRadius + 4, 0);
  labels.earth.position.copy(earthPosition).add(new THREE.Vector3(0, labelLift * 2.9 + 1.5, 0));
  labels.moon.position.copy(moonPosition).add(new THREE.Vector3(0, Math.max(scale.moonRadius * 3.8, 1.1), 0));

  earthMarker.position.copy(earthPosition);
  moonMarker.position.copy(moonPosition);
  earthMarker.lookAt(camera.position);
  moonMarker.lookAt(camera.position);

  const focusTarget = focusMode === 'earth' ? earthPosition : new THREE.Vector3(0, 0, 0);
  const delta = focusTarget.clone().sub(previousFocus);
  camera.position.add(delta);
  controls.target.add(delta);
  previousFocus.copy(focusTarget);

  rebuildOrbits(state.date);
}

function speedLabel(value) {
  if (value === 1) return '1x';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 60) return `${sign}${abs}x`;
  if (abs < 3600) return `${sign}${abs / 60}분/s`;
  if (abs < 86400) return `${sign}${abs / 3600}시간/s`;
  if (abs < 604800) return `${sign}${abs / 86400}일/s`;
  return `${sign}${abs / 604800}주/s`;
}

function formatKm(value) {
  return `${Math.round(value).toLocaleString('ko-KR')} km`;
}

function updateHud(state, now) {
  if (now - lastHudUpdate < 120) return;
  lastHudUpdate = now;
  readouts.local.textContent = localFormatter.format(state.date);
  readouts.utc.textContent = state.date.toISOString().replace('T', ' ').slice(0, 19);
  readouts.speed.textContent = paused ? '정지' : speedLabel(SPEEDS[speedIndex]);
  readouts.gmst.textContent = `${state.gmst.toFixed(2)}°`;
  readouts.phase.textContent = `${moonPhaseName(state.phaseAngle)} ${Math.round(state.illumination * 100)}%`;
  readouts.moonDistance.textContent = formatKm(state.earthMoonKm);
  readouts.sunDistance.textContent = formatKm(state.earthSunKm);
}

function changeSpeed(delta) {
  speedIndex = Math.max(0, Math.min(SPEEDS.length - 1, speedIndex + delta));
}

buttons.speedDown.addEventListener('click', () => changeSpeed(-1));
buttons.speedUp.addEventListener('click', () => changeSpeed(1));
buttons.pause.addEventListener('click', () => {
  paused = !paused;
  setButtonStates();
});
buttons.now.addEventListener('click', () => {
  simulationMs = Date.now();
  speedIndex = SPEEDS.indexOf(1);
  paused = false;
  setButtonStates();
  frameFocus();
});
buttons.focusEarth.addEventListener('click', () => {
  focusMode = 'earth';
  setButtonStates();
  frameFocus();
});
buttons.focusSun.addEventListener('click', () => {
  focusMode = 'sun';
  setButtonStates();
  frameFocus();
});
buttons.scaleMode.addEventListener('click', () => {
  scaleMode = scaleMode === 'visual' ? 'real' : 'visual';
  applyScale();
  frameFocus();
});
buttons.toggleOrbits.addEventListener('click', () => {
  orbitsVisible = !orbitsVisible;
  setButtonStates();
});

window.addEventListener('keydown', (event) => {
  if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.code === 'Space') {
    event.preventDefault();
    paused = !paused;
    setButtonStates();
  } else if (event.code === 'ArrowLeft') {
    changeSpeed(-1);
  } else if (event.code === 'ArrowRight') {
    changeSpeed(1);
  } else if (event.key === 'r' || event.key === 'R') {
    frameFocus();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(now) {
  requestAnimationFrame(animate);

  let deltaSeconds = (now - previousAnimationMs) / 1000;
  previousAnimationMs = now;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) deltaSeconds = 0;
  deltaSeconds = Math.min(deltaSeconds, 0.1);

  if (!paused) {
    simulationMs += deltaSeconds * 1000 * SPEEDS[speedIndex];
  }

  const state = computeState(new Date(simulationMs));
  updateScene(state);
  controls.update();
  renderer.render(scene, camera);
  updateHud(state, now);

  if (!firstFrameRendered) {
    firstFrameRendered = true;
    loading.classList.add('is-hidden');
    window.__SOLAR_READY = true;
  }
}

applyScale();
setButtonStates();
frameFocus();
requestAnimationFrame(animate);

window.solarProject = {
  computeState,
  setScaleMode(mode) {
    if (!SCALES[mode]) return;
    scaleMode = mode;
    applyScale();
    frameFocus();
  },
  setFocusMode(mode) {
    if (!['earth', 'sun'].includes(mode)) return;
    focusMode = mode;
    setButtonStates();
    frameFocus();
  },
};
