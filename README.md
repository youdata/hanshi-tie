# 苏轼 · 黄州寒食诗帖

A deep-zoom reading of Su Shi's *Cold Food Observance* scroll (台北故宫博物院藏), as a static page.

Live: https://youdata.github.io/hanshi-tie/

The image pyramid is a tile folder (`hanshi/header.idx` + `hanshi/{z}/{x}/{y}.png`), so any static host serves it.

It is also an installable web app that works **offline**: an ordinary visit saves nothing; when you **install** it
(Chrome/Edge: Install in the address bar; Android: Install app; iOS Safari: Share ▸ Add to Home Screen, then open it
from the home screen) it saves every file (30 MB, all 5,244 tiles) in the background, and from then on opens and zooms
with no network. An update downloads only the files that changed: `manifest.webmanifest`, `sw.js`, `pwa.js` and the icons (寒, cropped
from the scroll).

Its fonts (Noto Serif SC, Noto Sans SC) are in `fonts/`, trimmed to the scroll's characters (350 KB together), so the
page doesn't depend on Google Fonts being reachable.

## How it is made

With rx (`~/rx-cli`, the platform's command tool) from the editor session `smw5c05pmw8tz`:

```sh
rx pull --session smw5c05pmw8tz --out hanshi-tie.page.json        # the drawing, out of the editor
rx export hanshi-tie.page.json --out site --app /rx-graphic-editor/web/index.html \
   --canvas --theme dark --lock-layers --tiles dir --pwa --pwa-icon icon-512.png
rx publish site --to github:youdata/hanshi-tie                     # a dry run: what would change
rx publish site --to github:youdata/hanshi-tie --yes               # commit, push, the Pages build, the live file checked
```

The export is checked as a reader opens it, every request to the author's own machine refused; only changed files are
copied (the 5,244 tiles stay as they are).
