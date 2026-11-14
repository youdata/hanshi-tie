# 苏轼 · 黄州寒食诗帖

A deep-zoom reading of Su Shi's *Cold Food Observance* scroll (台北故宫博物院藏), as a static page.

Live: https://youdata.github.io/hanshi-tie/

The image pyramid is a tile folder (`hanshi/header.idx` + `hanshi/{z}/{x}/{y}.png`), so any static host serves it.

It is also an installable web app that works **offline**: on the first visit the page saves every file (30 MB, all
5,244 tiles) in the background; after that it opens and zooms with no network, and can be installed (Chrome/Edge:
Install in the address bar; Android: Add to Home screen; iOS Safari: Share ▸ Add to Home Screen). An update downloads
only the files that changed. Made by `tools/tile_export.mjs --pwa` (rx-infographic-skill): `manifest.webmanifest`,
`sw.js`, `pwa.js` and the icons (寒, cropped from the scroll).
