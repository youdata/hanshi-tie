// The site's PWA script (tools/site_pwa.mjs copies it as pwa.js, loaded by index.html): registers sw.js, shows the
// offline download's progress (a small bar, top left), says when the site works offline, and — when a new version has
// downloaded in the background — offers to switch to it. From file:// (no service workers there) it does nothing.
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return
  const zh = /^zh/i.test(navigator.language || '')
  const T = zh
    ? { get: (p, mb, all) => `正在下载离线版 ${p}%（${mb} / ${all} MB）`, up: (p) => `正在下载新版本 ${p}%`, ready: '已可离线使用', fail: '离线下载未完成，稍后会再试',
      update: '有新版本', go: '更新', later: '稍后' }
    : { get: (p, mb, all) => `Saving for offline ${p}% (${mb} / ${all} MB)`, up: (p) => `Downloading the new version ${p}%`, ready: 'Ready to use offline', fail: 'Offline download incomplete — will retry later',
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

  navigator.serviceWorker.addEventListener('message', e => {
    const m = e.data || {}
    if (m.type === 'pwa-progress') {
      const p = Math.floor(100 * m.bytes / Math.max(1, m.totalBytes))
      state.status = 'downloading'; state.progress = m
      if (m.done < m.total) show(m.update ? T.up(p) : T.get(p, (m.bytes / 1e6).toFixed(1), (m.totalBytes / 1e6).toFixed(1)))
    } else if (m.type === 'pwa-installed') { state.installed = m
      if (!m.update) { state.status = 'ready'; state.version = m.version; show(T.ready, { hideAfter: 3500 }) }
    } else if (m.type === 'pwa-failed') { state.status = 'failed'; state.error = m.error; show(T.fail, { hideAfter: 6000 }) }
    else if (m.type === 'pwa-version') state.version = m.version
  })
  // the new version took over (the user's Update): the page reloads into it
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (switching) location.reload() })

  window.addEventListener('load', async () => {
    let reg
    try { reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }) } catch (e) { state.status = 'no-worker'; state.error = String(e); return }
    state.registration = reg
    navigator.storage?.persist?.().catch(() => {})                     // ask the browser not to evict the offline copy
    if (navigator.serviceWorker.controller) { state.status = 'ready'; navigator.serviceWorker.controller.postMessage({ type: 'version' }) }
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting)
    reg.addEventListener('updatefound', () => {
      const w = reg.installing
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w) })
    })
    // a new version looked for whenever the page is shown again or the network is back
    const check = () => reg.update().catch(() => {})
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
    window.addEventListener('online', check)
  })
})()
