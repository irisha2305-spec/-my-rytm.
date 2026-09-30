"use strict";

// Змінюйте v1 на v2, v3 тощо, коли публікуєте нову версію.
const CACHE = "my-rytm-shell-v1";
const FILES = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
  );
});

// Нова версія активується після закриття вкладок попередньої.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("my-rytm-shell-") && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  if (url.origin !== scope.origin ||
      !url.pathname.startsWith(scope.pathname)) return;

  const indexURL = new URL("./index.html", scope).href;
  const shellURLs = FILES.map(file => new URL(file, scope).href);

  // Стабільна версія оболонки для онлайн- і офлайн-запуску.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const saved = await cache.match(indexURL);
        if (saved) return saved;
        return fetch(request);
      })
    );
    return;
  }

  if (shellURLs.includes(url.href)) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const saved = await cache.match(request);
        return saved || fetch(request);
      })
    );
  }
});
