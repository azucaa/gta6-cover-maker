// Panel layouts for NEON PALMS covers. A layout is a list of polygons in
// normalised 0..1 coordinates; layoutPanels() scales them to pixels for a
// given canvas size. The four layouts echo multi-panel poster covers:
// a hero panel with supporting strips, diagonal slashes, one big hero over
// strips, and an offset quad.

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const LAYOUTS = {
  // Syndicate Grid: hero top-left, two stacked right, three strips below.
  grid: () => [
    [[0, 0], [0.58, 0], [0.55, 0.58], [0, 0.58]],
    rect(0.58, 0, 1, 0.29),
    [[0.58, 0.29], [1, 0.29], [1, 0.58], [0.55, 0.58]],
    rect(0, 0.58, 0.34, 1),
    rect(0.34, 0.58, 0.67, 1),
    rect(0.67, 0.58, 1, 1),
  ],
  // Slash: four tall panels cut by parallel diagonal dividers.
  slash: () => {
    const s = 0.07;
    const polys = [];
    for (let i = 0; i < 4; i++) {
      const x0 = i * 0.25;
      const x1 = x0 + 0.25;
      polys.push([
        [Math.min(x0 + s, 1), 0],
        [Math.min(x1 + s, 1), 0],
        [Math.max(x1 - s, 0), 1],
        [Math.max(x0 - s, 0), 1],
      ]);
    }
    polys[0][3] = [0, 1];
    polys[0][0] = [0, 0];
    polys[3][1] = [1, 0];
    polys[3][2] = [1, 1];
    return polys;
  },
  // Hero + Strips: one wide hero over three equal strips.
  hero: () => [
    rect(0, 0, 1, 0.62),
    rect(0, 0.62, 0.335, 1),
    rect(0.335, 0.62, 0.665, 1),
    rect(0.665, 0.62, 1, 1),
  ],
  // Quad: 2 x 2 with an offset centre cross.
  quad: () => [
    rect(0, 0, 0.54, 0.52),
    rect(0.54, 0, 1, 0.47),
    rect(0, 0.52, 0.46, 1),
    rect(0.46, 0.47, 1, 1),
  ],
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

/** Panels of `name` scaled to a w x h canvas, as pixel point arrays. */
export function layoutPanels(name, w, h) {
  const polys = (LAYOUTS[name] ?? LAYOUTS.grid)();
  return polys.map((poly) => poly.map(([x, y]) => [x * w, y * h]));
}

/** Axis-aligned bounding box of a polygon: [x, y, width, height]. */
export function panelBox(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0];
}

/** Polygon shrunk toward its centroid so a keyline gap shows between panels. */
export function insetPolygon(poly, gapPx) {
  const [bx, by, bw, bh] = panelBox(poly);
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const kx = bw > 0 ? gapPx / bw : 0;
  const ky = bh > 0 ? gapPx / bh : 0;
  return poly.map(([x, y]) => [cx + (x - cx) * (1 - kx), cy + (y - cy) * (1 - ky)]);
}

/** True when pixel point (x, y) falls inside the polygon. */
export function pointInPolygon(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
