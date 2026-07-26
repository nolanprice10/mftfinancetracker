const CACHE_NAME = "mft-cache-v1";
const OFFLINE_HTML = "index.html";

function inScopePath(path) {
  const scopePath = new URL(self.registration.scope).pathname;
  return `${scopePath}${path}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        inScopePath(""),
        inScopePath("index.html"),
        inScopePath("manifest.json"),
        inScopePath("icons/icon-192.png"),
        inScopePath("icons/icon-512.png"),
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          return caches.match(inScopePath(OFFLINE_HTML));
        })
    );
    return;
  }

  if (sameOrigin && ["script", "style", "image", "font"].includes(event.request.destination)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
  }
});
