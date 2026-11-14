// The site's PWA script (tools/site_pwa.mjs copies it as pwa.js, loaded by index.html): registers sw.js — which saves
// nothing on an ordinary visit — and asks it to SAVE THE SITE FOR OFFLINE only when the user installs the app: the
// browser's `appinstalled` (Chrome, Edge, Android), or the app opened from the home screen (display-mode standalone; iOS,
// which has no install event — and where a download was cut short: it goes on). A small bar (top left) shows how far it
// is; when an installed site's new version has downloaded in the background it offers to switch to it. From file:// (no
// service workers there) it does nothing.
//   window.__pwa: { status, version, progress, installed, download() — the same download, by hand }
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return
  const zh = /^zh/i.test(navigator.language || '')
  const T = zh
    ? { start: '正在准备离线版…', get: (p, mb, all) => `正在下载离线版 ${p}%（${mb} / ${all} MB）`, up: (p) => `正在下载新版本 ${p}%`, ready: '已可离线使用', fail: '离线下载未完成，下次打开时继续',
      update: '有新版本', go: '更新', later: '稍后' }
    : { start: 'Preparing the offline copy…', get: (p, mb, all) => `Saving for offline ${p}% (${mb} / ${all} MB)`, up: (p) => `Downloading the new version ${p}%`, ready: 'Ready to use offline', fail: 'Offline download incomplete — it goes on next time',
      update: 'A new version', go: 'Update', later: 'Later' }
  const state = window.__pwa = { status: 'starting', version: null }

  let bar = null, timer = 0
  const show = (text, { buttons = [], hideAfter = 0 } = {}) => {
    if (!bar) {
      bar = document.createElement('div')
      bar.setAttribute('role', 'status')
      bar.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147483000;display:flex;gap:10px;align-items:center;max-width:calc(100vw - 24px);' +
        'padding:7px 12px;border-radius:8px;background:rgba(20,18,16,.88);color:#f3ece0;font:13px/1.35 ui-sans-serif,system-ui,sans-serif;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.35);transition:opacity .4s'
      document.body.appendChild(bar)
    }
    clearTimeout(timer); bar.style.opacity = '1'; bar.replaceChildren(Object.assign(document.createElement('span'), { textContent: text }))
    for (const [label, fn, main] of buttons) {
      const b = document.createElement('button'); b.textContent = label
      b.style.cssText = `font:inherit;cursor:pointer;border:0;border-radius:6px;padding:3px 10px;${main ? 'background:#e2b45a;color:#1b1408;font-weight:600' : 'background:transparent;color:inherit;opacity:.7'}`
      b.onclick = fn; bar.appendChild(b)
    }
    if (hideAfter) timer = setTimeout(hide, hideAfter)
  }
  const hide = () => { if (!bar) return; bar.style.opacity = '0'; const b = bar; bar = null; setTimeout(() => b.remove(), 450) }

  let switching = false
  const offer = w => { state.status = 'update-waiting'
    show(T.update, { buttons: [[T.go, () => { switching = true; w.postMessage({ type: 'skip-waiting' }) }, true], [T.later, hide]] }) }

  // the download: asked of the worker running this page's version (once there is one)
  state.download = async () => {
    const reg = await navigator.serviceWorker.ready
    if (state.status !== 'offline') { state.status = 'downloading'; show(T.start) }
    ;(navigator.serviceWorker.controller || reg.active)?.postMessage({ type: 'download-all' })
    navigator.storage?.persist?.().catch(() => {})                     // ask the browser not to evict the offline copy
  }
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true

  navigator.serviceWorker.addEventListener('message', e => {
    const m = e.data || {}
    if (m.type === 'pwa-progress') {
      const p = Math.floor(100 * m.bytes / Math.max(1, m.totalBytes))
      state.progress = m
      if (m.done < m.total) { if (!m.update) state.status = 'downloading'; show(m.update ? T.up(p) : T.get(p, (m.bytes / 1e6).toFixed(1), (m.totalBytes / 1e6).toFixed(1))) }
    } else if (m.type === 'pwa-installed') { state.installed = m
      if (!m.update) { state.status = 'offline'; state.saved = true; state.version = m.version; if (!m.already) show(T.ready, { hideAfter: 3500 }) }
    } else if (m.type === 'pwa-failed') { state.status = 'failed'; state.error = m.error; show(T.fail, { hideAfter: 6000 }) }
    else if (m.type === 'pwa-status') { state.version = m.version; state.saved = m.complete
      if (m.complete) state.status = 'offline'
      else if (m.wanted || standalone()) state.download()                // installed, the download cut short: go on
      else state.status = 'online' }
  })
  // the new version took over (the user's Update): the page reloads into it
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (switching) location.reload() })
  // the user installed the app: save the site for offline
  window.addEventListener('appinstalled', () => state.download())

  window.addEventListener('load', async () => {
    let reg
    try { reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }) } catch (e) { state.status = 'no-worker'; state.error = String(e); return }
    state.registration = reg
    const ready = await navigator.serviceWorker.ready
    ;(navigator.serviceWorker.controller || ready.active)?.postMessage({ type: 'status' })
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting)   // (only an offline copy's version waits)
    reg.addEventListener('updatefound', () => {
      const w = reg.installing
      // (a visitor's new version takes over by itself — it saves nothing: offered only where the site is kept offline)
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller && state.saved) offer(w) })
    })
    // a new version looked for whenever the page is shown again or the network is back
    const check = () => reg.update().catch(() => {})
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
    window.addEventListener('online', check)
  })
})()
