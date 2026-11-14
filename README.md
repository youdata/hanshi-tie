# 苏轼 · 黄州寒食诗帖

A deep-zoom reading of Su Shi's *Cold Food Observance* scroll (台北故宫博物院藏), as a static page.

Live: https://youdata.github.io/hanshi-tie/

The image pyramid is a tile folder (`hanshi/header.idx` + `hanshi/{z}/{x}/{y}.png`), so any static host serves it.

It is also an installable web app that works **offline**: an ordinary visit saves nothing; when you **install** it
(Chrome/Edge: Install in the address bar; Android: Install app; iOS Safari: Share ▸ Add to Home Screen, then open it
from the home screen) it saves every file (30 MB, all 5,244 tiles) in the background, and from then on opens and zooms
with no network. An update downloads only the files that changed. Made by `tools/tile_export.mjs --pwa`
(rx-infographic-skill): `manifest.webmanifest`, `sw.js`, `pwa.js` and the icons (寒, cropped from the scroll).
