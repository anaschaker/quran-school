// service worker بسيط لدعم التثبيت (PWA)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // استراتيجية network-first (بدون تخزين مؤقت معقد)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
