const CACHE_NAME = 'iscream-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('offline', {status:503})));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
