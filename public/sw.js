// network-first للصفحة، cache-first للملفات المتجزّأة (hash في الاسم)
const C = 'odoo20-v6'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())))
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin) return
  const hashed = /\/assets\//.test(u.pathname)
  e.respondWith(hashed
    ? caches.match(r).then(m => m || fetch(r).then(x => { const c = x.clone(); caches.open(C).then(k => k.put(r, c)); return x }))
    : fetch(r).then(x => { const c = x.clone(); caches.open(C).then(k => k.put(r, c)); return x }).catch(() => caches.match(r).then(m => m || caches.match('./'))))
})
