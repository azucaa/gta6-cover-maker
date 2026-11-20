# Build plan — gta6-cover-art-01

## App identity (original, no Rockstar IP)

- **Name: "NEON PALMS — Poster Cover Maker".** All branding is my own words and
  layout; no Rockstar logo, wordmark, official artwork, character, or game font
  anywhere. The look is *inspired by* multi-panel movie/game poster covers:
  angled photo panels, heavy keylines, big condensed caption type, sunset/neon
  colour grade — drawn entirely by my own code on canvas.
- Structure stays the starter's shape: static files under `app/`, ES modules in
  `app/src/`, no build step, no network. `main.ts` keeps the starter plumbing
  (copy `app/` + `screenshots/`, `buildDossier`) with my own authored edits
  (title/limits comment + one real change: a post-copy size report), and every
  file gets at least one revision pass after its first write.

## Files I will write under app/

- `app/index.html` — editor page: canvas stage, panel/photo controls, caption
  fields, grade + layout pickers, export buttons. Loads only files in `app/`.
- `app/style.css` — dark editor chrome, neon accents, `shot-cover` mode hides
  the editor so `?shot=cover` shows the cover alone (starter pattern).
- `app/src/main.js` — wires UI state to the renderer, file loading
  (`URL.createObjectURL`, photos never leave the machine), export buttons.
- `app/src/panels.js` — panel layout definitions (polygons per aspect ratio).
- `app/src/grade.js` — colour-grade presets applied on offscreen canvases.
- `app/src/cover.js` — the renderer: panels → graded photos → keylines →
  caption lettering → vignette/grain. One `drawCover(canvas, state)` entry.
- `app/src/shots.js` — `?shot=` scenes for screenshots (cover / editor),
  sets `window.__shotReady` after paint, as the starter does.
- `app/fonts/Anton-Regular.ttf` + `app/fonts/OFL.txt` — caption font (below).
- `app/samples/pier.jpg`, `app/samples/boulevard.jpg` — the kit's AI-made
  sample photos, free to use; kept as the built-in demo photos.

## Panel layouts (the GTA-poster look)

Panels are polygons with thick off-white keylines and a slight diagonal energy;
layout recomputed per export aspect so one design serves all three sizes.

1. **Syndicate Grid (default)** — hero panel top-left (~55% × 55%), two stacked
   panels right, three strip panels along the bottom. 6 panels.
2. **Slash** — 4 tall panels cut by parallel diagonal dividers (~8° slant),
   each panel's photo sheared with the cut.
3. **Hero + Strips** — one wide hero panel (~62% height) over 3 equal strips.
4. **Quad** — 2 × 2 grid with offset centre cross, simplest/cleanest.

Each panel: dark plum placeholder with panel number until a photo fills it;
thin inner shadow + per-panel grade variance (hue shift ±6°, sat ±10%) so
panels feel like separate shots, exactly like the reference posters.

## Photo handling — any photo, crop & position per panel

- Load photos via file input or drag-and-drop (multiple at once) into a photo
  tray; click a panel to select it, click a tray photo to assign it.
- "One photo, all panels" button fills every panel with the selected photo
  (the classic single-shoot cover); per-panel assignment allows several.
- Selected panel: drag on the canvas to pan, wheel / slider to zoom
  (cover-fit base scale × 0.5–3), double-click resets. State per panel:
  `{ photoId, dx, dy, scale }`. Keyboard arrows nudge for fine placement.
- Everything is drawn from state by `drawCover`, so the live preview and the
  exported PNG are the same pixels at any size.

## Caption typography

- **Font: Anton** (condensed poster sans, SIL Open Font License 1.1). This
  machine has no display face installed (checked: only DejaVu, Liberation and
  Noto families), so during the build I download `Anton-Regular.ttf` from the
  Google Fonts upstream into `app/fonts/` together with its OFL license text —
  a binary asset, vendored, never loaded from the network at run time.
  Fallback if the download fails: Liberation Sans Bold from
  `/usr/share/fonts/truetype/liberation/` (also OFL), with canvas-side
  condensing via horizontal scale.
- Loaded with `FontFace` from the local file; rendering waits for
  `document.fonts.ready` so exports never fall back to a system font.
- Lettering treatment: caption in all caps, tight tracking, white fill with a
  hard offset shadow in grade magenta; one accent word (last word) in neon
  yellow. Auto-fit: shrink-to-fit loop against 92% of cover width, up to two
  lines with manual `\n`. Optional smaller sub-caption line under the title
  (e.g. a city/tagline the user types). Title sits in a bottom band panel or
  overlaid on the hero panel — user toggle.

## Colour grade (canvas, no libraries)

Per photo, on an offscreen canvas at export resolution:
`ctx.filter = saturate(1.35) contrast(1.1) brightness(1.02)` while drawing,
then composite gradient overlays with `globalCompositeOperation`:

- **Sunset Vice** — vertical gradient deep purple `#2b1838` → magenta
  `#c82878` → orange `#ff7a3c`, `soft-light` + a low-alpha `overlay` pass.
- **Neon Night** — teal shadows / pink highlights split-tone, stronger sat.
- **Golden Hour** — warm amber wash, lifted shadows.
- **Noir** — desaturated, hard contrast, cool shadows.

Finish: radial vignette, subtle film grain (pre-generated noise pattern at low
alpha), and the keyline pass on top so panels stay crisp.

## Export

Buttons for **1080 × 1080**, **1080 × 1350**, **1920 × 1080**: render state to
an offscreen canvas at the exact size, `toBlob('image/png')`, download as
`neon-palms-cover-<w>x<h>.png`. Few steps: photo → assign → caption → export;
defaults (Syndicate Grid + Sunset Vice + samples) make a good cover in 2
clicks without any upload.

## Screenshots (3–4, gate limits: ≤256 KiB each, long side ≤1280, short ≥480)

Driven by `shots.json` + `?shot=` modes, captured with headless Chrome
(Puppeteer) waiting on `window.__shotReady`, saved as quality-tuned JPEGs:

1. `1-cover.jpg` — exported **1920 × 1080** cover (Syndicate Grid, pier photo,
   caption "PALM CITY HEAT") shown at 1280 × 720 — landscape, so it fills the
   judge's 768 × 480 cover cell.
2. `2-editor.jpg` — editor at 1280 × 720 with boulevard photo loaded across
   panels, tray + controls visible.
3. `3-portrait.jpg` — exported **1080 × 1350** cover at 1024 × 1280
   (Slash layout, boulevard, caption "MIDNIGHT RUN").
4. `4-square.jpg` — exported **1080 × 1080** cover at 1024 × 1024
   (Hero + Strips, pier, Neon Night grade).

Demo photos: the kit's two AI-made samples only — no real people, no game art.
Each file checked with `identify`/`file` for dimensions and byte size ≤ 262144
before handing in; re-export at lower JPEG quality if over.

## Validation before submitting

1. `node serve.ts`, open in desktop Chrome: load photos, drag/zoom panels,
   switch layouts/grades, edit caption, export all three sizes; confirm the
   PNGs match the preview and DevTools shows **zero network requests**.
2. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — then check the
   gate caps against `out/`: app ≤ 993 files and ≤ 48 MiB, `index.html`
   ≤ 1 MiB, screenshots 3–4 files each ≤ 256 KiB / long ≤ 1280 / short ≥ 480,
   `dossier.json` ≤ 1.5 MiB and produced by the unchanged
   `vendor/makefun-app.ts`.
3. Reference audit: every `src`/`href`/import in `app/` resolves to a file
   inside `app/` or a `data:` URI; no `http:`/`https:` strings in reachable
   scripts; fonts and samples are local files.
4. Determinism: run `main.ts` twice, compare `out/` hashes — must be identical.
