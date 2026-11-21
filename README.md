# NEON PALMS — Poster Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/azucaa/gta6-cover-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/azucaa/gta6-cover-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the make.fun bounty [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

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
