/* Boardcard service worker: keeps the app shell available, shows review notifications, and never touches API calls. */
const V = 'boardcard-v5';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.png', 'logo-mark.png'];
// Only these same-origin files are kept in the cache; anything else goes straight to the network.
const STATIC_RE = /\.(png|jpe?g|webp|svg|ico|webmanifest|woff2?)$/i;
const PAGE_WAIT = 5000;   // on a very slow connection the saved copy of the page opens after this many ms

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

const keep = (e, p) => { try { e.waitUntil(p); } catch (x) {} };
// The saved page. A copy that came through a redirect cannot answer a navigation, so it is skipped.
const savedPage = () => caches.open(V).then(c =>
  c.match('index.html').then(hit => (hit && !hit.redirected) ? hit : c.match('./').then(h => (h && !h.redirected) ? h : undefined)));

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // Only same-origin GETs. Supabase, fonts and CDNs go straight to the network.
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  // Never touch the API (admin metrics, student notes/progress, backups): always straight to the network.
  if (u.pathname.startsWith('/api/')) return;

  // The app page: network first (so updates arrive immediately), saved copy when offline or when the network is too slow.
  if (r.mode === 'navigate') {
    if (!/\/(index\.html)?$/.test(u.pathname)) return;   // other pages (e.g. the admin panel) are not cached
    const net = fetch(r).then(res => {
      // Only a good, direct answer replaces the saved copy (an error page must never be saved).
      if (res.ok && !res.redirected) { const copy = res.clone(); keep(e, caches.open(V).then(c => c.put('index.html', copy))); }
      return res;
    });
    net.catch(() => {});
    const slow = new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), PAGE_WAIT));
    e.respondWith(
      Promise.race([net, slow]).catch(() => savedPage().then(hit => hit || net))
    );
    return;
  }

  // Versioned code (app.js?v=..., app.css?v=...) and the vendor library never change under the same URL: cache first.
  if (/\.(js|css)$/i.test(u.pathname) && (u.search.indexOf('v=') > -1 || u.pathname.indexOf('/vendor/') > -1)) {
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          // The new version is saved, then older versions of the same file are removed so the cache does not grow with every update.
          keep(e, caches.open(V).then(c => c.put(r, copy).then(() => c.keys()).then(ks => Promise.all(
            ks.filter(k => { const ku = new URL(k.url); return ku.pathname === u.pathname && ku.search !== u.search; }).map(k => c.delete(k))))));
        }
        return res;
      }))
    );
    return;
  }
  if (!STATIC_RE.test(u.pathname)) return;
  // Static files (icons, logo, manifest): answer from the cache at once and refresh the copy in the background.
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res.ok && res.type === 'basic') { const copy = res.clone(); keep(e, caches.open(V).then(c => c.put(r, copy))); }
        return res;
      });
      if (hit) { keep(e, net.catch(() => {})); return hit; }
      return net;
    })
  );
});

/* ---------- Review reminders (Web Push) ----------
   The server may send JSON {title, body, url, tag}, plain text, or nothing at all; every case shows a notification. */
self.addEventListener('push', e => {
  let d = {};
  if (e.data) {
    try { d = e.data.json() || {}; }
    catch (x) { try { d = { body: e.data.text() }; } catch (y) { d = {}; } }
  }
  if (typeof d !== 'object') d = { body: String(d) };
  e.waitUntil(self.registration.showNotification(String(d.title || 'Boardcard'), {
    body: String(d.body || 'لديك أسئلة مستحقة للمراجعة اليوم.'),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: String(d.tag || 'bc-review'),
    data: { url: typeof d.url === 'string' ? d.url : './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const scope = self.registration.scope;
  let target = scope;
  try {
    const t = new URL((e.notification.data && e.notification.data.url) || './', scope);
    if (t.origin === self.location.origin) target = t.href;   // never open another site from a notification
  } catch (x) {}
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.indexOf(scope) === 0 && 'focus' in c) {
          try { const h = new URL(target).hash; if (h) c.postMessage({ type: 'open', hash: h }); } catch (x) {}
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
