// Fixed scenes for screenshots. ?shot=cover shows the cover alone at the
// window's size; ?shot=editor shows the editor with a scene loaded.
// Query params: layout, grade, caption (use %0A for the second line), sub,
// size (a preset like 1920x1080 the editor preview adopts), and photos: a
// comma list of sample names assigned to panels in order, wrapping around.
// window.__shotReady is set once the scene has painted.

export function parseShot(query) {
  return {
    mode: query.get('shot'),
    layout: query.get('layout') ?? 'grid',
    grade: query.get('grade') ?? 'sunset',
    caption: query.get('caption') ?? 'PALM CITY\nHEAT',
    sub: query.get('sub') ?? 'A NEON PALMS STORY',
    size: query.get('size') ?? '1920x1080',
    photos: (query.get('photos') ?? 'pier,boulevard').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
