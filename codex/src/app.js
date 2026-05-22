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
const BASE_SIMULATION_MS = new Date(2026, 4, 22, 0, 0, 0).getTime();

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

const SPEEDS = [-604800, -86400, -21600, -3600, -600, -60, -10, -1, 1, 10, 60, 100, 600, 3600, 21600, 86400, 604800];
const TIMELINE_SPAN_DAYS = 730;
const TIMELINE_RECENTER_THRESHOLD_DAYS = 700;

const PLANET_DEFS = [
  {
    id: 'mercury',
    label: 'Mercury',
    radiusKm: 2439.7,
    visualRadius: 0.5,
    orbitColor: 0x8f877c,
    baseColor: '#9d8e7d',
    accentColor: '#4f4740',
    seed: 5101,
    rotationHours: 1407.5,
    periodDays: 87.969,
    elements: (d) => ({
      node: 48.3313 + 3.24587e-5 * d,
      inclination: 7.0047 + 5.00e-8 * d,
      periapsis: 29.1241 + 1.01444e-5 * d,
      semiMajorAxis: 0.387098,
      eccentricity: 0.205635 + 5.59e-10 * d,
      meanAnomaly: 168.6562 + 4.0923344368 * d,
    }),
  },
  {
    id: 'venus',
    label: 'Venus',
    radiusKm: 6051.8,
    visualRadius: 1.12,
    orbitColor: 0xc99b5a,
    baseColor: '#d7a960',
    accentColor: '#fff0bb',
    seed: 5102,
    rotationHours: -5832.5,
    periodDays: 224.701,
    elements: (d) => ({
      node: 76.6799 + 2.46590e-5 * d,
      inclination: 3.3946 + 2.75e-8 * d,
      periapsis: 54.8910 + 1.38374e-5 * d,
      semiMajorAxis: 0.723330,
      eccentricity: 0.006773 - 1.302e-9 * d,
      meanAnomaly: 48.0052 + 1.6021302244 * d,
    }),
  },
  {
    id: 'mars',
    label: 'Mars',
    radiusKm: 3389.5,
    visualRadius: 0.72,
    orbitColor: 0xc26642,
    baseColor: '#b45131',
    accentColor: '#e6c09c',
    seed: 5104,
    rotationHours: 24.623,
    periodDays: 686.98,
    elements: (d) => ({
      node: 49.5574 + 2.11081e-5 * d,
      inclination: 1.8497 - 1.78e-8 * d,
      periapsis: 286.5016 + 2.92961e-5 * d,
      semiMajorAxis: 1.523688,
      eccentricity: 0.093405 + 2.516e-9 * d,
      meanAnomaly: 18.6021 + 0.5240207766 * d,
    }),
  },
  {
    id: 'jupiter',
    label: 'Jupiter',
    radiusKm: 69911,
    visualRadius: 4.2,
    orbitColor: 0xd3a071,
    baseColor: '#d4ad84',
    accentColor: '#7d4b31',
    seed: 5105,
    rotationHours: 9.925,
    periodDays: 4332.59,
    banded: true,
    elements: (d) => ({
      node: 100.4542 + 2.76854e-5 * d,
      inclination: 1.3030 - 1.557e-7 * d,
      periapsis: 273.8777 + 1.64505e-5 * d,
      semiMajorAxis: 5.20256,
      eccentricity: 0.048498 + 4.469e-9 * d,
      meanAnomaly: 19.8950 + 0.0830853001 * d,
    }),
  },
  {
    id: 'saturn',
    label: 'Saturn',
    radiusKm: 58232,
    visualRadius: 3.65,
    orbitColor: 0xd8bd82,
    baseColor: '#dfbf82',
    accentColor: '#9d764f',
    seed: 5106,
    rotationHours: 10.656,
    periodDays: 10759.22,
    banded: true,
    ring: true,
    elements: (d) => ({
      node: 113.6634 + 2.38980e-5 * d,
      inclination: 2.4886 - 1.081e-7 * d,
      periapsis: 339.3939 + 2.97661e-5 * d,
      semiMajorAxis: 9.55475,
      eccentricity: 0.055546 - 9.499e-9 * d,
      meanAnomaly: 316.9670 + 0.0334442282 * d,
    }),
  },
  {
    id: 'uranus',
    label: 'Uranus',
    radiusKm: 25362,
    visualRadius: 2.35,
    orbitColor: 0x78dce4,
    baseColor: '#78d6dc',
    accentColor: '#d6ffff',
    seed: 5107,
    rotationHours: -17.24,
    periodDays: 30688.5,
    elements: (d) => ({
      node: 74.0005 + 1.3978e-5 * d,
      inclination: 0.7733 + 1.9e-8 * d,
      periapsis: 96.6612 + 3.0565e-5 * d,
      semiMajorAxis: 19.18171 - 1.55e-8 * d,
      eccentricity: 0.047318 + 7.45e-9 * d,
      meanAnomaly: 142.5905 + 0.011725806 * d,
    }),
  },
  {
    id: 'neptune',
    label: 'Neptune',
    radiusKm: 24622,
    visualRadius: 2.28,
    orbitColor: 0x5d78e8,
    baseColor: '#3f67cc',
    accentColor: '#9ab6ff',
    seed: 5108,
    rotationHours: 16.11,
    periodDays: 60182,
    elements: (d) => ({
      node: 131.7806 + 3.0173e-5 * d,
      inclination: 1.7700 - 2.55e-7 * d,
      periapsis: 272.8461 - 6.027e-6 * d,
      semiMajorAxis: 30.05826 + 3.313e-8 * d,
      eccentricity: 0.008606 + 2.15e-9 * d,
      meanAnomaly: 260.2471 + 0.005995147 * d,
    }),
  },
];

const PLANET_BY_ID = Object.fromEntries(PLANET_DEFS.map((planet) => [planet.id, planet]));

const BODY_PROFILES = {
  sun: {
    name: 'Sun',
    type: 'Star Profile',
    diameterKm: 1_392_680,
    orbit: '태양계 중심',
    rotation: '약 25일',
    summary: '태양계 질량의 대부분을 차지하는 항성입니다. 장면에서는 자체 발광 재질과 글로우로 표현됩니다.',
  },
  mercury: {
    name: 'Mercury',
    type: 'Planet Profile',
    diameterKm: 4_879,
    orbit: '87.97일',
    rotation: '58.6일',
    summary: '태양에 가장 가까운 암석 행성입니다. 빠른 공전과 큰 궤도 이심률을 가집니다.',
  },
  venus: {
    name: 'Venus',
    type: 'Planet Profile',
    diameterKm: 12_104,
    orbit: '224.7일',
    rotation: '243일 역행',
    summary: '두꺼운 대기와 높은 반사율을 가진 행성입니다. 자전 방향이 대부분 행성과 반대입니다.',
  },
  earth: {
    name: 'Earth',
    type: 'Planet Profile',
    diameterKm: 12_742,
    orbit: '365.26일',
    rotation: '23.93시간',
    summary: '달과의 상대 위치를 별도로 계산하는 기준 행성입니다. 자전각은 Julian Date 기반 GMST로 표시됩니다.',
  },
  moon: {
    name: 'Moon',
    type: 'Satellite Profile',
    diameterKm: 3_475,
    orbit: '27.32일',
    rotation: '동주기 자전',
    summary: '지구의 위성입니다. 달의 지구 상대 위치는 조석 계산 확장을 고려해 별도 천체력으로 계산합니다.',
  },
  mars: {
    name: 'Mars',
    type: 'Planet Profile',
    diameterKm: 6_779,
    orbit: '686.98일',
    rotation: '24.62시간',
    summary: '붉은 표면과 지구와 비슷한 하루 길이를 가진 암석 행성입니다.',
  },
  jupiter: {
    name: 'Jupiter',
    type: 'Planet Profile',
    diameterKm: 139_822,
    orbit: '11.86년',
    rotation: '9.93시간',
    summary: '태양계에서 가장 큰 행성입니다. 빠른 자전과 줄무늬 대기 패턴을 시각화했습니다.',
  },
  saturn: {
    name: 'Saturn',
    type: 'Planet Profile',
    diameterKm: 116_464,
    orbit: '29.46년',
    rotation: '10.66시간',
    summary: '넓은 고리계를 가진 가스 행성입니다. 고리는 반투명 텍스처가 입혀진 별도 매시로 표현됩니다.',
  },
  uranus: {
    name: 'Uranus',
    type: 'Planet Profile',
    diameterKm: 50_724,
    orbit: '84.0년',
    rotation: '17.24시간 역행',
    summary: '자전축이 크게 기울어진 얼음 거대 행성입니다.',
  },
  neptune: {
    name: 'Neptune',
    type: 'Planet Profile',
    diameterKm: 49_244,
    orbit: '164.8년',
    rotation: '16.11시간',
    summary: '태양계의 가장 바깥쪽 주요 행성입니다. 긴 공전 주기와 푸른 색감을 가집니다.',
  },
};

const readouts = {
  date: document.getElementById('readout-date'),
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
  timeBackDay: document.getElementById('time-back-day'),
  timeForwardDay: document.getElementById('time-forward-day'),
  timeLive: document.getElementById('time-live'),
  timeReset: document.getElementById('time-reset'),
  focusEarth: document.getElementById('focus-earth'),
  focusSun: document.getElementById('focus-sun'),
  focusTarget: document.getElementById('focus-target'),
  scaleMode: document.getElementById('scale-mode'),
  toggleOrbits: document.getElementById('toggle-orbits'),
};

const timeControls = {
  input: document.getElementById('time-input'),
  range: document.getElementById('time-range'),
};

const infoPanel = {
  root: document.getElementById('info-panel'),
  overview: document.getElementById('overview'),
  kicker: document.getElementById('info-kicker'),
  title: document.getElementById('info-title'),
  diameter: document.getElementById('info-diameter'),
  orbit: document.getElementById('info-orbit'),
  rotation: document.getElementById('info-rotation'),
  summary: document.getElementById('info-summary'),
};

const jumpButtons = Array.from(document.querySelectorAll('[data-time-jump]'));
const speedPresetButtons = Array.from(document.querySelectorAll('[data-speed]'));

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

function planetElements(days, planet) {
  const elements = planet.elements(days);
  const node = rev(elements.node);
  const inclination = elements.inclination;
  const periapsis = rev(elements.periapsis);
  const eccentricity = elements.eccentricity;
  const meanAnomaly = rev(elements.meanAnomaly);
  const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

  const xv = elements.semiMajorAxis * (cosDeg(eccentricAnomaly) - eccentricity);
  const yv = elements.semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * sinDeg(eccentricAnomaly);
  const trueAnomaly = atan2Deg(yv, xv);
  const radiusAu = Math.sqrt(xv * xv + yv * yv);

  const xh = radiusAu * (cosDeg(node) * cosDeg(trueAnomaly + periapsis)
    - sinDeg(node) * sinDeg(trueAnomaly + periapsis) * cosDeg(inclination));
  const yh = radiusAu * (sinDeg(node) * cosDeg(trueAnomaly + periapsis)
    + cosDeg(node) * sinDeg(trueAnomaly + periapsis) * cosDeg(inclination));
  const zh = radiusAu * (sinDeg(trueAnomaly + periapsis) * sinDeg(inclination));

  return {
    id: planet.id,
    radiusAu,
    longitude: rev(atan2Deg(yh, xh)),
    latitude: atan2Deg(zh, Math.sqrt(xh * xh + yh * yh)),
    vectorAu: toSceneVector(xh, yh, zh),
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
  const planets = Object.fromEntries(PLANET_DEFS.map((planet) => [planet.id, planetElements(days, planet)]));
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
    days,
    sun,
    moon,
    planets,
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

function makePlanetTexture(planet) {
  const rand = seededRandom(planet.seed);
  return canvasTexture(1024, 512, (ctx, width, height) => {
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, planet.accentColor);
    base.addColorStop(0.42, planet.baseColor);
    base.addColorStop(1, planet.accentColor);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    if (planet.banded) {
      for (let y = 0; y < height; y += 18 + rand() * 18) {
        const alpha = 0.12 + rand() * 0.28;
        ctx.fillStyle = rand() > 0.45 ? `rgba(255,245,220,${alpha})` : `rgba(80,48,32,${alpha})`;
        ctx.fillRect(0, y, width, 8 + rand() * 22);
      }
    } else {
      for (let i = 0; i < 80; i += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const radius = 8 + rand() * 48;
        const detail = ctx.createRadialGradient(x, y, 0, x, y, radius);
        detail.addColorStop(0, `rgba(255,255,255,${0.06 + rand() * 0.12})`);
        detail.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = detail;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (planet.id === 'mars') {
      ctx.fillStyle = 'rgba(245,238,210,0.88)';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, 0, width * 0.4, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height, width * 0.34, 34, 0, 0, Math.PI * 2);
      ctx.fill();
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

function makeRingTexture() {
  return canvasTexture(512, 64, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(222,198,142,0)');
    gradient.addColorStop(0.14, 'rgba(222,198,142,0.28)');
    gradient.addColorStop(0.22, 'rgba(246,230,184,0.74)');
    gradient.addColorStop(0.36, 'rgba(134,108,76,0.38)');
    gradient.addColorStop(0.44, 'rgba(40,31,22,0.08)');
    gradient.addColorStop(0.53, 'rgba(236,216,165,0.76)');
    gradient.addColorStop(0.72, 'rgba(171,139,91,0.48)');
    gradient.addColorStop(0.92, 'rgba(246,230,184,0.24)');
    gradient.addColorStop(1, 'rgba(222,198,142,0)');
    ctx.fillStyle = gradient;
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.bias = -0.00008;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 4000;
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x4d5872, 0.28));
scene.add(makeStarField());

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 96, 64),
  new THREE.MeshBasicMaterial({ map: makeSunTexture() }),
);
sunMesh.userData.bodyId = 'sun';
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
earthMesh.castShadow = true;
earthMesh.receiveShadow = true;
earthMesh.userData.bodyId = 'earth';
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
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
moonMesh.userData.bodyId = 'moon';
scene.add(moonMesh);

const planetGeometry = new THREE.SphereGeometry(1, 64, 48);
const planetMeshes = Object.fromEntries(PLANET_DEFS.map((planet) => {
  const mesh = new THREE.Mesh(
    planetGeometry,
    new THREE.MeshStandardMaterial({
      map: makePlanetTexture(planet),
      roughness: 0.96,
      metalness: 0,
      emissive: new THREE.Color(planet.orbitColor).multiplyScalar(0.08),
      emissiveIntensity: 0.18,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.planet = planet;
  mesh.userData.bodyId = planet.id;
  scene.add(mesh);
  return [planet.id, mesh];
}));

const saturnRing = new THREE.Mesh(
  new THREE.RingGeometry(1.38, 2.18, 128),
  new THREE.MeshBasicMaterial({
    map: makeRingTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
saturnRing.rotation.set(64 * DEG, 0, 18 * DEG);
saturnRing.castShadow = true;
saturnRing.receiveShadow = true;
scene.add(saturnRing);

const earthOrbit = makeOrbitLine(0x4e92d8, 0.42);
const moonOrbit = makeOrbitLine(0xd8d8e6, 0.38);
scene.add(earthOrbit);
scene.add(moonOrbit);

const planetOrbits = Object.fromEntries(PLANET_DEFS.map((planet) => {
  const line = makeOrbitLine(planet.orbitColor, planet.id === 'neptune' || planet.id === 'uranus' ? 0.24 : 0.34);
  scene.add(line);
  return [planet.id, line];
}));

const labels = {
  sun: makeLabel('Sun'),
  earth: makeLabel('Earth'),
  moon: makeLabel('Moon'),
};
const planetLabels = Object.fromEntries(PLANET_DEFS.map((planet) => {
  const label = makeLabel(planet.label);
  scene.add(label);
  return [planet.id, label];
}));
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
const focusMarker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({
  color: 0xffca67,
  transparent: true,
  opacity: 0.54,
  side: THREE.DoubleSide,
}));
scene.add(earthMarker, moonMarker, focusMarker);

const clickableBodies = [sunMesh, earthMesh, moonMesh, ...Object.values(planetMeshes)];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerDown = new THREE.Vector2();

let scaleMode = 'visual';
let focusMode = 'earth';
let orbitsVisible = true;
let paused = false;
let speedIndex = SPEEDS.indexOf(1);
let simulationMs = BASE_SIMULATION_MS;
let timelineAnchorMs = simulationMs;
let previousAnimationMs = performance.now();
let previousFocus = new THREE.Vector3();
let lastHudUpdate = 0;
let lastMoonOrbitBucket = Number.NaN;
let lastSolarOrbitBucket = Number.NaN;
let firstFrameRendered = false;
let timeInputFocused = false;
let cameraTween = null;

function currentScale() {
  return SCALES[scaleMode];
}

function localDateTimeValue(ms) {
  const date = new Date(ms);
  const localMs = ms - date.getTimezoneOffset() * 60000;
  return new Date(localMs).toISOString().slice(0, 19);
}

function localDateValue(ms) {
  return localDateTimeValue(ms).slice(0, 10);
}

function parseLocalDateTime(value) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : null;
}

function recenterTimeline(ms = simulationMs) {
  timelineAnchorMs = ms;
}

function updateTimeControls() {
  const offsetDays = (simulationMs - timelineAnchorMs) / DAY_MS;
  if (Math.abs(offsetDays) > TIMELINE_RECENTER_THRESHOLD_DAYS) {
    recenterTimeline(simulationMs);
  }

  const nextOffsetDays = (simulationMs - timelineAnchorMs) / DAY_MS;
  timeControls.range.value = String(Math.max(-TIMELINE_SPAN_DAYS, Math.min(TIMELINE_SPAN_DAYS, nextOffsetDays)));
  if (!timeInputFocused) {
    timeControls.input.value = localDateTimeValue(simulationMs);
  }

  const nearLive = Math.abs(simulationMs - Date.now()) < 2500 && SPEEDS[speedIndex] === 1 && !paused;
  buttons.timeLive.classList.toggle('is-active', nearLive);
}

function setSimulationTime(ms, options = {}) {
  if (!Number.isFinite(ms)) return;
  simulationMs = ms;
  if (options.recenter) recenterTimeline(ms);
  if (options.pause) paused = true;
  if (options.resume) paused = false;
  setButtonStates();
  updateTimeControls();
  frameFocus();
}

function jumpToLive() {
  simulationMs = Date.now();
  recenterTimeline(simulationMs);
  speedIndex = SPEEDS.indexOf(1);
  paused = false;
  setButtonStates();
  updateTimeControls();
  frameFocus();
}

function resetToBaseDate() {
  setSimulationTime(BASE_SIMULATION_MS, { resume: true, recenter: true });
}

function shiftCalendar({ days = 0, months = 0, years = 0 }) {
  const date = new Date(simulationMs);
  if (years) date.setFullYear(date.getFullYear() + years);
  if (months) date.setMonth(date.getMonth() + months);
  if (days) date.setDate(date.getDate() + days);
  setSimulationTime(date.getTime(), { resume: true, recenter: true });
}

function applyJumpToken(token) {
  const sign = token.startsWith('-') ? -1 : 1;
  const amount = Number(token.slice(1, -1));
  const unit = token.slice(-1);
  if (unit === 'd') shiftCalendar({ days: sign * amount });
  if (unit === 'm') shiftCalendar({ months: sign * amount });
  if (unit === 'y') shiftCalendar({ years: sign * amount });
}

function earthPositionUnits(state, scale) {
  return state.earthVectorAu.clone().multiplyScalar(scale.au);
}

function moonOffsetUnits(state, scale) {
  return state.moon.vectorEarthRadii.clone().multiplyScalar(scale.moonDistancePerEarthRadius);
}

function planetPositionUnits(state, scale, planetId) {
  return state.planets[planetId].vectorAu.clone().multiplyScalar(scale.au);
}

function planetRadiusUnits(scale, planet) {
  if (scaleMode === 'real') return (planet.radiusKm / AU_KM) * scale.au;
  return planet.visualRadius;
}

function bodyPositionUnits(bodyId, state, scale) {
  if (bodyId === 'sun') return new THREE.Vector3(0, 0, 0);
  const earthPosition = earthPositionUnits(state, scale);
  if (bodyId === 'earth') return earthPosition;
  if (bodyId === 'moon') return earthPosition.add(moonOffsetUnits(state, scale));
  if (state.planets[bodyId]) return planetPositionUnits(state, scale, bodyId);
  return earthPosition;
}

function bodyRadiusUnits(bodyId, scale) {
  if (bodyId === 'sun') return scale.sunRadius;
  if (bodyId === 'earth') return scale.earthRadius;
  if (bodyId === 'moon') return scale.moonRadius;
  if (PLANET_BY_ID[bodyId]) return planetRadiusUnits(scale, PLANET_BY_ID[bodyId]);
  return scale.earthRadius;
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

function buildPlanetOrbitPoints(planet, centerDate) {
  const startDay = daysSinceEpoch(centerDate) - planet.periodDays / 2;
  const points = [];
  const scale = currentScale();
  for (let i = 0; i < 640; i += 1) {
    const day = startDay + (planet.periodDays * i) / 640;
    points.push(planetElements(day, planet).vectorAu.multiplyScalar(scale.au));
  }
  return points;
}

function rebuildOrbits(date, force = false) {
  const days = daysSinceEpoch(date);
  const solarBucket = Math.floor(days / 7);
  const moonBucket = Math.floor(days);
  if (force || solarBucket !== lastSolarOrbitBucket) {
    lastSolarOrbitBucket = solarBucket;
    setLinePoints(earthOrbit, buildEarthOrbitPoints(date));
    for (const planet of PLANET_DEFS) {
      setLinePoints(planetOrbits[planet.id], buildPlanetOrbitPoints(planet, date));
    }
  }
  if (force || moonBucket !== lastMoonOrbitBucket) {
    lastMoonOrbitBucket = moonBucket;
    setLinePoints(moonOrbit, buildMoonOrbitPoints(date));
  }
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
  focusMarker.scale.setScalar(Math.max(bodyRadiusUnits(focusMode, scale) * 2.2, scale.earthGlow * 0.72));
  for (const planet of PLANET_DEFS) {
    const radius = planetRadiusUnits(scale, planet);
    planetMeshes[planet.id].scale.setScalar(radius);
    if (planet.id === 'saturn') {
      saturnRing.scale.setScalar(radius);
    }
    setLabelScalar(planetLabels[planet.id], scaleMode === 'real' ? 0.28 : 0.52);
  }
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
  buttons.focusTarget.value = focusMode;
  for (const button of speedPresetButtons) {
    button.classList.toggle('is-active', SPEEDS[speedIndex] === Number(button.dataset.speed));
  }
}

function cameraFrameFor(bodyId, state, scale) {
  const targetPosition = bodyPositionUnits(bodyId, state, scale);
  const targetRadius = bodyRadiusUnits(bodyId, scale);

  if (bodyId === 'sun') {
    const distance = scale.au * 38;
    return {
      target: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(distance * 0.28, distance * 0.42, distance),
    };
  }

  const moonOffset = moonOffsetUnits(state, scale);
  const localContext = bodyId === 'earth' ? moonOffset.length() : scale.au * 0.08;
  const distance = Math.max(targetRadius * 9, localContext, 6);
  const lift = bodyId === 'moon' ? distance * 0.3 : distance * 0.48;
  return {
    target: targetPosition,
    position: targetPosition.clone().add(new THREE.Vector3(distance * 0.7, lift, distance * 1.42)),
  };
}

function frameFocus(options = {}) {
  const state = computeState(new Date(simulationMs));
  const scale = currentScale();
  const earthPosition = earthPositionUnits(state, scale);
  const moonOffset = moonOffsetUnits(state, scale);
  const moonPosition = earthPosition.clone().add(moonOffset);
  const frame = cameraFrameFor(focusMode, state, scale);

  if (options.smooth) {
    cameraTween = {
      startTime: performance.now(),
      duration: 950,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: frame.position.clone(),
      toTarget: frame.target.clone(),
    };
  } else {
    cameraTween = null;
    controls.target.copy(frame.target);
    camera.position.copy(frame.position);
    previousFocus.copy(frame.target);
    camera.lookAt(controls.target);
  }

  moonOrbit.position.copy(earthPosition);
  moonMesh.position.copy(moonPosition);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function updateScene(state, now) {
  const scale = currentScale();
  const earthPosition = earthPositionUnits(state, scale);
  const moonOffset = moonOffsetUnits(state, scale);
  const moonPosition = earthPosition.clone().add(moonOffset);
  const labelLift = Math.max(scale.earthRadius, scale.earthGlow);
  const focusTarget = bodyPositionUnits(focusMode, state, scale);
  const focusRadius = bodyRadiusUnits(focusMode, scale);

  earthSystem.position.copy(earthPosition);
  moonMesh.position.copy(moonPosition);
  moonMesh.lookAt(earthPosition);
  earthMesh.rotation.y = -state.gmst * DEG;

  moonOrbit.position.copy(earthPosition);
  moonOrbit.visible = orbitsVisible;
  earthOrbit.visible = orbitsVisible;
  for (const planet of PLANET_DEFS) {
    const position = planetPositionUnits(state, scale, planet.id);
    const mesh = planetMeshes[planet.id];
    const label = planetLabels[planet.id];
    const radius = planetRadiusUnits(scale, planet);
    mesh.position.copy(position);
    mesh.rotation.y = (state.days * 24 / planet.rotationHours) * Math.PI * 2;
    label.position.copy(position).add(new THREE.Vector3(0, Math.max(radius * 2.6, 1.1), 0));
    planetOrbits[planet.id].visible = orbitsVisible;
    if (planet.id === 'saturn') {
      saturnRing.position.copy(position);
      saturnRing.visible = true;
    }
  }

  labels.sun.position.set(0, scale.sunRadius + 4, 0);
  labels.earth.position.copy(earthPosition).add(new THREE.Vector3(0, labelLift * 2.9 + 1.5, 0));
  labels.moon.position.copy(moonPosition).add(new THREE.Vector3(0, Math.max(scale.moonRadius * 3.8, 1.1), 0));
  labels.sun.visible = true;
  labels.earth.visible = true;
  labels.moon.visible = true;
  for (const planet of PLANET_DEFS) {
    planetLabels[planet.id].visible = true;
  }

  earthMarker.position.copy(earthPosition);
  moonMarker.position.copy(moonPosition);
  focusMarker.position.copy(focusTarget);
  focusMarker.visible = !['sun', 'earth', 'moon'].includes(focusMode);
  focusMarker.scale.setScalar(Math.max(focusRadius * 1.8, scaleMode === 'real' ? 0.04 : 0.9));
  earthMarker.lookAt(camera.position);
  moonMarker.lookAt(camera.position);
  focusMarker.lookAt(camera.position);

  if (cameraTween) {
    const t = Math.min(1, (now - cameraTween.startTime) / cameraTween.duration);
    const eased = easeOutCubic(t);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    if (t >= 1) {
      cameraTween = null;
      const currentFrame = cameraFrameFor(focusMode, state, scale);
      camera.position.copy(currentFrame.position);
      controls.target.copy(currentFrame.target);
      previousFocus.copy(currentFrame.target);
    }
  } else {
    const delta = focusTarget.clone().sub(previousFocus);
    camera.position.add(delta);
    controls.target.add(delta);
    previousFocus.copy(focusTarget);
  }

  rebuildOrbits(state.date);
}

function speedLabel(value) {
  if (value === 1) return '1x';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if ([1, 10, 100].includes(abs) || abs < 60) return `${sign}${abs}x`;
  if (abs < 3600) return `${sign}${abs / 60}분/s`;
  if (abs < 86400) return `${sign}${abs / 3600}시간/s`;
  if (abs < 604800) return `${sign}${abs / 86400}일/s`;
  return `${sign}${abs / 604800}주/s`;
}

function formatKm(value) {
  return `${Math.round(value).toLocaleString('ko-KR')} km`;
}

function formatDiameter(value) {
  return `${Math.round(value).toLocaleString('ko-KR')} km`;
}

function showInfoPanel(bodyId) {
  const profile = BODY_PROFILES[bodyId];
  if (!profile) {
    infoPanel.root.hidden = true;
    return;
  }

  infoPanel.root.hidden = false;
  infoPanel.kicker.textContent = profile.type;
  infoPanel.title.textContent = profile.name;
  infoPanel.diameter.textContent = formatDiameter(profile.diameterKm);
  infoPanel.orbit.textContent = profile.orbit;
  infoPanel.rotation.textContent = profile.rotation;
  infoPanel.summary.textContent = profile.summary;
}

function selectBodyFocus(bodyId, options = {}) {
  if (!BODY_PROFILES[bodyId]) return;
  focusMode = bodyId;
  setButtonStates();
  showInfoPanel(options.showInfo === false ? null : bodyId);
  frameFocus({ smooth: options.smooth === true });
}

function returnToOverview() {
  focusMode = 'sun';
  setButtonStates();
  showInfoPanel(null);
  frameFocus({ smooth: true });
}

function updateHud(state, now) {
  if (now - lastHudUpdate < 120) return;
  lastHudUpdate = now;
  readouts.date.textContent = localDateValue(state.date.getTime());
  readouts.local.textContent = localFormatter.format(state.date);
  readouts.utc.textContent = state.date.toISOString().replace('T', ' ').slice(0, 19);
  readouts.speed.textContent = paused ? '정지' : speedLabel(SPEEDS[speedIndex]);
  readouts.gmst.textContent = `${state.gmst.toFixed(2)}°`;
  readouts.phase.textContent = `${moonPhaseName(state.phaseAngle)} ${Math.round(state.illumination * 100)}%`;
  readouts.moonDistance.textContent = formatKm(state.earthMoonKm);
  readouts.sunDistance.textContent = formatKm(state.earthSunKm);
  updateTimeControls();
}

function changeSpeed(delta) {
  speedIndex = Math.max(0, Math.min(SPEEDS.length - 1, speedIndex + delta));
  setButtonStates();
  updateTimeControls();
}

function setSpeedValue(value) {
  const index = SPEEDS.indexOf(value);
  if (index === -1) return;
  speedIndex = index;
  setButtonStates();
  updateTimeControls();
}

buttons.speedDown.addEventListener('click', () => changeSpeed(-1));
buttons.speedUp.addEventListener('click', () => changeSpeed(1));
for (const button of speedPresetButtons) {
  button.addEventListener('click', () => setSpeedValue(Number(button.dataset.speed)));
}
buttons.pause.addEventListener('click', () => {
  paused = !paused;
  setButtonStates();
  updateTimeControls();
});
buttons.now.addEventListener('click', () => {
  jumpToLive();
});
buttons.timeLive.addEventListener('click', () => {
  jumpToLive();
});
buttons.timeBackDay.addEventListener('click', () => {
  shiftCalendar({ days: -1 });
});
buttons.timeForwardDay.addEventListener('click', () => {
  shiftCalendar({ days: 1 });
});
buttons.timeReset.addEventListener('click', () => resetToBaseDate());
for (const button of jumpButtons) {
  button.addEventListener('click', () => applyJumpToken(button.dataset.timeJump));
}
timeControls.input.addEventListener('focus', () => {
  timeInputFocused = true;
});
timeControls.input.addEventListener('blur', () => {
  timeInputFocused = false;
  updateTimeControls();
});
timeControls.input.addEventListener('change', () => {
  const nextMs = parseLocalDateTime(timeControls.input.value);
  if (nextMs !== null) {
    setSimulationTime(nextMs, { pause: true, recenter: true });
  }
});
timeControls.range.addEventListener('input', () => {
  const offsetDays = Number(timeControls.range.value);
  setSimulationTime(timelineAnchorMs + offsetDays * DAY_MS, { pause: true });
});
buttons.focusEarth.addEventListener('click', () => {
  selectBodyFocus('earth', { smooth: true, showInfo: false });
});
buttons.focusSun.addEventListener('click', () => {
  selectBodyFocus('sun', { smooth: true, showInfo: false });
});
buttons.focusTarget.addEventListener('change', () => {
  selectBodyFocus(buttons.focusTarget.value, { smooth: true, showInfo: false });
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
infoPanel.overview.addEventListener('click', () => returnToOverview());

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown.set(event.clientX, event.clientY);
});

renderer.domElement.addEventListener('pointerup', (event) => {
  const moved = pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  if (moved > 6) return;
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickableBodies, false)[0];
  const bodyId = hit?.object?.userData?.bodyId;
  if (bodyId) {
    selectBodyFocus(bodyId, { smooth: true });
  }
});

window.addEventListener('keydown', (event) => {
  if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.code === 'Space') {
    event.preventDefault();
    paused = !paused;
    setButtonStates();
    updateTimeControls();
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
  updateScene(state, now);
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
updateTimeControls();
frameFocus();
requestAnimationFrame(animate);

window.solarProject = {
  computeState,
  getSimulationDate() {
    return new Date(simulationMs).toISOString();
  },
  getSimulationDateLabel() {
    return localDateValue(simulationMs);
  },
  setSimulationDate(value) {
    const nextMs = value instanceof Date ? value.getTime() : new Date(value).getTime();
    setSimulationTime(nextMs, { pause: true, recenter: true });
  },
  getBodyScreenPosition(bodyId) {
    const state = computeState(new Date(simulationMs));
    const position = bodyPositionUnits(bodyId, state, currentScale()).project(camera);
    return {
      x: (position.x * 0.5 + 0.5) * window.innerWidth,
      y: (-position.y * 0.5 + 0.5) * window.innerHeight,
      visible: position.z >= -1 && position.z <= 1,
    };
  },
  focusBody(bodyId) {
    selectBodyFocus(bodyId, { smooth: true });
  },
  setScaleMode(mode) {
    if (!SCALES[mode]) return;
    scaleMode = mode;
    applyScale();
    frameFocus();
  },
  setFocusMode(mode) {
    selectBodyFocus(mode, { smooth: true, showInfo: false });
  },
};
