// 实时同传：让网页能像 App 一样从桌面打开；有网时总是用最新版，没网时用上次的缓存打开
const CACHE = 'tongchuan-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // 翻译、识别接口不经过这里
  const isPage = req.mode === 'navigate';
  e.respondWith((async () => {
    try{
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), isPage ? 5000 : 8000);
      const res = await fetch(req, { signal: ctrl.signal, cache: 'no-cache' }); clearTimeout(t);
      if (res && res.ok){ const c = await caches.open(CACHE); c.put(isPage ? './index.html' : req, res.clone()); }
      return res;
    }catch(err){
      const c = await caches.open(CACHE);
      return (await c.match(isPage ? './index.html' : req)) || (await c.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
