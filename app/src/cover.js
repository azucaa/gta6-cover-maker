// The NEON PALMS cover renderer. drawCover() paints the whole cover from a
// plain state object, so the editor preview and the exported PNG are the
// same drawing at any size:
//
//   state = {
//     layout: 'grid' | 'slash' | 'hero' | 'quad',
//     grade: 'sunset' | 'neon' | 'golden' | 'noir',
//     caption: 'PALM CITY\nHEAT',       // up to two lines
//     sub: 'A NEON PALMS STORY',        // small line above the caption
//     panels: [{ img, dx, dy, scale }], // one entry per layout panel;
//                                       // img is an Image or null,
//                                       // dx/dy pan in panel-box fractions
//     selected: 0,                      // panel outlined in the editor
//     editor: false,                    // draw editor-only guides when true
//   }

import { layoutPanels, panelBox, insetPolygon } from './panels.js';
import { GRADES, paintWashes, paintGrain, paintVignette } from './grade.js';

export const CAPTION_FONT = 'Anton';
const KEYLINE = '#f7f1e3';
const PLUM = '#22122f';

function tracePath(ctx, poly) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function drawPanelPhoto(ctx, poly, panel, gradeName, index) {
  const [bx, by, bw, bh] = panelBox(poly);
  ctx.save();
  tracePath(ctx, poly);
  ctx.clip();
  // Placeholder: deep plum gradient with a big ghost panel number.
  const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bg.addColorStop(0, '#3a1c50');
  bg.addColorStop(1, PLUM);
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  if (panel.img) {
    const img = panel.img;
    const base = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const scale = base * (panel.scale || 1);
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const px = bx + (bw - pw) / 2 + (panel.dx || 0) * bw;
    const py = by + (bh - ph) / 2 + (panel.dy || 0) * bh;
    ctx.filter = (GRADES[gradeName] ?? GRADES.sunset).filter;
    ctx.drawImage(img, px, py, pw, ph);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = 'rgba(247, 241, 227, 0.16)';
    ctx.font = `${Math.min(bw, bh) * 0.52}px ${CAPTION_FONT}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), bx + bw / 2, by + bh / 2);
    ctx.textBaseline = 'alphabetic';
  }
  // Grade washes clipped to this panel, with a whisper of per-panel variance.
  ctx.globalAlpha = 0.92 + (index % 3) * 0.05;
  paintWashes(ctx, gradeName, bx, by, bw, bh);
  ctx.globalAlpha = 1;
  // Inner shade at the panel's foot so seams stay readable under the caption.
  const shade = ctx.createLinearGradient(0, by + bh * 0.72, 0, by + bh);
  shade.addColorStop(0, 'rgba(10, 3, 18, 0)');
  shade.addColorStop(1, 'rgba(10, 3, 18, 0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(bx, by, bw, bh);
  ctx.restore();
}

function drawCaption(ctx, w, h, state) {
  const lines = (state.caption || '')
    .toUpperCase()
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (!lines.length) return;
  // Scrim behind the lettering.
  const scrimH = h * 0.36;
  const scrim = ctx.createLinearGradient(0, h - scrimH, 0, h);
  scrim.addColorStop(0, 'rgba(12, 3, 20, 0)');
  scrim.addColorStop(1, 'rgba(12, 3, 20, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h - scrimH, w, scrimH);

  // Fit the widest line to 92% of the width, capped by a height share.
  let size = Math.min(h * 0.135, w * 0.24);
  ctx.textAlign = 'left';
  const setFont = () => {
    ctx.font = `${size}px ${CAPTION_FONT}, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older engines */ }
  };
  setFont();
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  if (widest > w * 0.92) {
    size *= (w * 0.92) / widest;
    setFont();
  }
  const lineH = size * 1.04;
  const blockH = lineH * lines.length;
  const baseline = h - h * 0.055;

  // Sub-caption: small, wide-tracked, above the title block, on a dark chip
  // so it stays readable over bright photo panels.
  if (state.sub) {
    ctx.save();
    const subText = state.sub.toUpperCase();
    ctx.font = `600 ${Math.max(11, h * 0.021)}px 'Segoe UI', system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, h * 0.006)}px`; } catch { /* older engines */ }
    ctx.textAlign = 'center';
    const subY = baseline - blockH - h * 0.018;
    const subW = ctx.measureText(subText).width;
    const chipH = h * 0.021 * 1.9;
    ctx.fillStyle = 'rgba(12, 3, 20, 0.55)';
    ctx.fillRect(w / 2 - subW / 2 - h * 0.012, subY - chipH * 0.72, subW + h * 0.024, chipH);
    ctx.fillStyle = '#ffd9ec';
    ctx.fillText(subText, w / 2, subY);
    ctx.restore();
    setFont();
  }

  // Poster lettering: magenta hard offset under a white face; the last word
  // of the last line is picked out in neon yellow.
  lines.forEach((line, li) => {
    const y = baseline - (lines.length - 1 - li) * lineH;
    const words = line.split(/\s+/);
    const widths = words.map((word) => ctx.measureText(word).width);
    const spaceW = ctx.measureText(' ').width;
    const total = widths.reduce((a, b) => a + b, 0) + spaceW * (words.length - 1);
    let x = (w - total) / 2;
    words.forEach((word, wi) => {
      const isAccent = li === lines.length - 1 && wi === words.length - 1 && (words.length > 1 || lines.length > 1);
      ctx.fillStyle = '#ff2e88';
      ctx.fillText(word, x + size * 0.045, y + size * 0.045);
      ctx.fillStyle = isAccent ? '#ffd23f' : '#ffffff';
      ctx.fillText(word, x, y);
      x += widths[wi] + spaceW;
    });
  });
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
}

function drawBrand(ctx, w, h) {
  const label = 'NEON PALMS';
  ctx.save();
  ctx.font = `${Math.max(12, h * 0.026)}px ${CAPTION_FONT}, sans-serif`;
  try { ctx.letterSpacing = `${Math.max(1, h * 0.004)}px`; } catch { /* older engines */ }
  const tw = ctx.measureText(label).width;
  const pad = h * 0.016;
  const bx = h * 0.028;
  const by = h * 0.028;
  ctx.fillStyle = 'rgba(12, 3, 20, 0.66)';
  ctx.fillRect(bx, by, tw + pad * 2, h * 0.026 + pad * 1.5);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(bx, by, h * 0.008, h * 0.026 + pad * 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(label, bx + pad + h * 0.006, by + pad * 1.32);
  ctx.restore();
}

/** Paints the full cover described by `state` onto `canvas`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.fillStyle = PLUM;
  ctx.fillRect(0, 0, w, h);
  const polys = layoutPanels(state.layout, w, h);
  const gap = Math.max(2, Math.min(w, h) * 0.007);
  polys.forEach((poly, i) => {
    drawPanelPhoto(ctx, insetPolygon(poly, gap), state.panels[i] ?? { img: null }, state.grade, i);
  });
  // Keylines between panels and around the rim.
  ctx.strokeStyle = KEYLINE;
  ctx.lineWidth = gap * 1.5;
  ctx.lineJoin = 'round';
  polys.forEach((poly) => {
    tracePath(ctx, poly);
    ctx.stroke();
  });
  ctx.strokeRect(0, 0, w, h);
  paintVignette(ctx, w, h);
  paintGrain(ctx, w, h);
  drawBrand(ctx, w, h);
  drawCaption(ctx, w, h, state);
  if (state.editor && state.selected >= 0 && polys[state.selected]) {
    ctx.save();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = Math.max(2, gap * 0.8);
    ctx.setLineDash([14, 9]);
    tracePath(ctx, insetPolygon(polys[state.selected], gap * 0.4));
    ctx.stroke();
    ctx.restore();
  }
  return polys;
}
