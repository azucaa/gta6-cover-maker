# NEON PALMS — Poster Cover Maker

A static web app that turns your own photos and a caption into multi-panel
poster cover art: angled photo panels with keylines, big condensed caption
lettering, and a sunset or neon colour grade — exported as a PNG in the
common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080.

Everything is original: the name, layout, lettering treatment and code are
this project's own. No Rockstar Games logo, wordmark, artwork, character or
font is used. The caption font is Anton, licensed under the SIL Open Font
License (see `app/fonts/OFL.txt`).

## Features

- Load photos from your own machine (they are never uploaded) and place them
  panel by panel, or fill every panel with one photo.
- Four panel layouts: Syndicate Grid, Slash, Hero + Strips, Quad.
- Per-panel crop: drag to pan, scroll or use the slider to zoom.
- Two-line editable caption with a sub-caption line.
- Four colour grades: Sunset Vice, Neon Night, Golden Hour, Noir.
- One-click PNG export at 1080 × 1080, 1080 × 1350 and 1920 × 1080.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. The app is plain static
files under `app/` and works fully offline.

## Hand in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the make.fun bounty "Make GTA 6 Cover Art":
https://make.fun/bounty/gta6-cover-art-01
