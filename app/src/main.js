// NEON PALMS editor: wires the page to the cover renderer. Photos are read
// from the person's own machine and never uploaded; everything the app
// loads is a file beside this one. A ?shot= query builds a fixed scene for
// screenshots instead of the default editor scene (./shots.js).

import { drawCover } from './cover.js';
import { layoutPanels, pointInPolygon } from './panels.js';
import { parseShot, markShotReady } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('stage');
const captionEl = document.getElementById('caption');
const subEl = document.getElementById('sub');
const statusEl = document.getElementById('status');
const trayEl = document.getElementById('tray');
const zoomEl = document.getElementById('zoom');

const state = {
  layout: 'grid',
  grade: 'sunset',
  caption: 'PALM CITY\nHEAT',
  sub: 'A NEON PALMS STORY',
  panels: Array.from({ length: 6 }, () => ({ img: null, dx: 0, dy: 0, scale: 1 })),
  selected: 0,
  editor: true,
};
const photos = []; // { img, name }
let traySel = -1;
let previewSize = '1920x1080';
let currentPolys = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadCaptionFont() {
  try {
    const anton = new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')");
    await anton.load();
    document.fonts.add(anton);
  } catch {
    // The CSS and canvas fall back to a heavy sans; the app still works.
  }
  await document.fonts.ready;
}

function redraw() {
  currentPolys = drawCover(canvas, state);
}

function setPreviewSize(name) {
  previewSize = name;
  const [w, h] = SIZES[name];
  const scale = Math.min(1, 1280 / w, 1080 / h);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  document.querySelectorAll('[data-preview]').forEach((b) =>
    b.classList.toggle('on', b.dataset.preview === name));
  redraw();
}

function renderTray() {
  trayEl.innerHTML = '';
  photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = photo.name;
    btn.classList.toggle('on', i === traySel);
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      traySel = i;
      state.panels[state.selected].img = photo.img;
      renderTray();
      redraw();
    });
    trayEl.appendChild(btn);
  });
}

async function addPhoto(url, name) {
  const img = await loadImage(url);
  photos.push({ img, name });
  traySel = photos.length - 1;
  renderTray();
  return img;
}

// --- Editor controls -------------------------------------------------------

document.getElementById('photo-files').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await addPhoto(URL.createObjectURL(file), file.name);
    if (state.panels[state.selected].img === null) state.panels[state.selected].img = img;
  }
  statusEl.textContent = `${photos.length} photo(s) loaded — click a panel, then a photo, to place it.`;
  redraw();
});

document.getElementById('fill-all').addEventListener('click', () => {
  if (traySel < 0) return;
  state.panels.forEach((p) => { p.img = photos[traySel].img; });
  redraw();
});

document.getElementById('clear-panel').addEventListener('click', () => {
  state.panels[state.selected].img = null;
  redraw();
});

zoomEl.addEventListener('input', () => {
  state.panels[state.selected].scale = zoomEl.value / 100;
  redraw();
});

function segWire(id, attr, apply) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest(`[data-${attr}]`);
    if (!btn) return;
    apply(btn.dataset[attr]);
    document.querySelectorAll(`#${id} button`).forEach((b) => b.classList.toggle('on', b === btn));
    redraw();
  });
}
segWire('layouts', 'layout', (v) => { state.layout = v; });
segWire('grades', 'grade', (v) => { state.grade = v; });

captionEl.addEventListener('input', () => { state.caption = captionEl.value; redraw(); });
subEl.addEventListener('input', () => { state.sub = subEl.value; redraw(); });

document.querySelectorAll('[data-preview]').forEach((btn) =>
  btn.addEventListener('click', () => setPreviewSize(btn.dataset.preview)));

document.querySelectorAll('.export').forEach((btn) =>
  btn.addEventListener('click', () => {
    const [w, h] = SIZES[btn.dataset.size];
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    drawCover(out, { ...state, editor: false, selected: -1 });
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-palms-cover-${w}x${h}.png`;
      a.click();
      statusEl.textContent = `Saved neon-palms-cover-${w}x${h}.png`;
    }, 'image/png');
  }));

// --- Canvas pan / zoom / select -------------------------------------------

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const ratio = canvas.width / canvas.height;
  let cw = rect.width;
  let ch = cw / ratio;
  if (ch > rect.height) { ch = rect.height; cw = ch * ratio; }
  const ox = rect.left + (rect.width - cw) / 2;
  const oy = rect.top + (rect.height - ch) / 2;
  return [(e.clientX - ox) / cw * canvas.width, (e.clientY - oy) / ch * canvas.height];
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const [x, y] = canvasPoint(e);
  const hit = currentPolys.findIndex((poly) => pointInPolygon(poly, x, y));
  if (hit >= 0) {
    state.selected = hit;
    zoomEl.value = Math.round((state.panels[hit].scale || 1) * 100);
  }
  const p = state.panels[state.selected];
  drag = { x, y, dx: p.dx, dy: p.dy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const [x, y] = canvasPoint(e);
  const p = state.panels[state.selected];
  const [, , bw, bh] = [0, 0, canvas.width, canvas.height];
  p.dx = drag.dx + (x - drag.x) / bw;
  p.dy = drag.dy + (y - drag.y) / bh;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.scale = Math.min(3, Math.max(0.5, (p.scale || 1) * Math.exp(-e.deltaY * 0.0012)));
  zoomEl.value = Math.round(p.scale * 100);
  redraw();
}, { passive: false });

// --- Scenes -----------------------------------------------------------------

function applyScene(scene) {
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.caption = scene.caption;
  state.sub = scene.sub;
  captionEl.value = scene.caption;
  subEl.value = scene.sub;
  document.querySelectorAll('#layouts button').forEach((b) =>
    b.classList.toggle('on', b.dataset.layout === scene.layout));
  document.querySelectorAll('#grades button').forEach((b) =>
    b.classList.toggle('on', b.dataset.grade === scene.grade));
}

async function loadScenePhotos(names) {
  for (const name of names) await addPhoto(`samples/${name}.jpg`, name);
  // Assign photos to panels in order, wrapping; vary crops so repeated
  // photos still read as different shots.
  const crops = [
    { dx: 0, dy: 0, scale: 1 },
    { dx: 0.06, dy: -0.04, scale: 1.25 },
    { dx: -0.07, dy: 0.03, scale: 1.45 },
    { dx: 0.03, dy: 0.06, scale: 1.15 },
    { dx: -0.04, dy: -0.05, scale: 1.35 },
    { dx: 0.08, dy: 0.02, scale: 1.2 },
  ];
  state.panels.forEach((p, i) => {
    p.img = photos[i % photos.length].img;
    Object.assign(p, crops[i % crops.length]);
  });
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
await loadCaptionFont();
if (shot) {
  const scene = parseShot(query);
  applyScene(scene);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.editor = false;
    state.selected = -1;
    // Size the bitmap from the laid-out viewport so it fills the window
    // exactly (window.innerWidth can disagree with the layout size).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  } else {
    setPreviewSize(SIZES[scene.size] ? scene.size : '1920x1080');
  }
  await loadScenePhotos(scene.photos);
  redraw();
  markShotReady();
} else {
  setPreviewSize('1920x1080');
  await loadScenePhotos(['pier', 'boulevard']);
  statusEl.textContent = 'Samples loaded — add your own photos to make it yours.';
  redraw();
}
