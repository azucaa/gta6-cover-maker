// Colour grades for NEON PALMS covers. Each grade is a CSS filter applied
// while a panel photo is drawn, plus one or two gradient washes composited
// over it. Everything runs on canvas: no library, no network.

export const GRADES = {
  sunset: {
    label: 'Sunset Vice',
    filter: 'saturate(1.38) contrast(1.1) brightness(1.03)',
    washes: [
      { stops: [[0, 'rgba(43, 24, 86, 0.55)'], [0.45, 'rgba(200, 40, 120, 0.28)'], [1, 'rgba(255, 122, 60, 0.5)']], mode: 'soft-light' },
      { stops: [[0, 'rgba(255, 90, 60, 0)'], [1, 'rgba(255, 60, 130, 0.22)']], mode: 'overlay' },
    ],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.16) brightness(1.0) hue-rotate(-10deg)',
    washes: [
      { stops: [[0, 'rgba(0, 229, 255, 0.35)'], [0.55, 'rgba(20, 0, 60, 0.2)'], [1, 'rgba(255, 46, 136, 0.45)']], mode: 'soft-light' },
      { stops: [[0, 'rgba(255, 46, 136, 0.16)'], [1, 'rgba(0, 229, 255, 0.16)']], mode: 'overlay' },
    ],
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.06) brightness(1.06) sepia(0.32)',
    washes: [
      { stops: [[0, 'rgba(255, 176, 66, 0.4)'], [1, 'rgba(146, 64, 14, 0.35)']], mode: 'soft-light' },
      { stops: [[0, 'rgba(255, 214, 120, 0.14)'], [1, 'rgba(255, 122, 60, 0.2)']], mode: 'overlay' },
    ],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(0.88) contrast(1.28) brightness(0.98)',
    washes: [
      { stops: [[0, 'rgba(30, 41, 59, 0.4)'], [1, 'rgba(2, 6, 23, 0.5)']], mode: 'soft-light' },
    ],
  },
};

export const GRADE_NAMES = Object.keys(GRADES);

/** Paints a grade's gradient washes over the rectangle (x, y, w, h). */
export function paintWashes(ctx, gradeName, x, y, w, h) {
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  for (const wash of grade.washes) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    for (const [at, colour] of wash.stops) grad.addColorStop(at, colour);
    ctx.save();
    ctx.globalCompositeOperation = wash.mode;
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

let grainPattern = null;

/** Subtle film grain over the whole canvas, from a generated noise tile. */
export function paintGrain(ctx, w, h) {
  if (!grainPattern) {
    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tctx = tile.getContext('2d');
    const data = tctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 108 + Math.random() * 40;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    tctx.putImageData(data, 0, 0);
    grainPattern = ctx.createPattern(tile, 'repeat');
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Soft dark vignette around the canvas edges. */
export function paintVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.55, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(8, 2, 16, 0)');
  grad.addColorStop(1, 'rgba(8, 2, 16, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
