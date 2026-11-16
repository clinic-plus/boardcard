/* Boardcard service worker: keeps the app shell available and never touches API calls. */
const V = 'boardcard-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.png', 'logo-mark.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // Only same-origin GETs. Supabase, fonts and CDNs go straight to the network.
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  // Never touch the API (admin metrics, student notes/progress, backups): always straight to the network.
  if (u.pathname.startsWith('/api/')) return;

  // The app page: network first (so updates arrive immediately), cached copy when offline.
  if (r.mode === 'navigate') {
    if (!/\/(index\.html)?$/.test(u.pathname)) return;   // other pages (e.g. the admin panel) are not cached
    e.respondWith(
      fetch(r)
        .then(res => { const copy = res.clone(); caches.open(V).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Static files (icons, manifest): cache first.
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
      return res;
    }))
  );
});
