const CACHE_NAME = "mft-cache-v2";
const OFFLINE_HTML = "index.html";

function inScopeUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type === "opaque") {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        inScopeUrl(""),
        inScopeUrl("index.html"),
        inScopeUrl("manifest.json"),
        inScopeUrl("icons/icon-192.png"),
        inScopeUrl("icons/icon-512.png"),
      ]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

async function handleNavigationRequest(event) {
  const preloadResponse = await event.preloadResponse;

  if (preloadResponse) {
    event.waitUntil(cacheResponse(event.request, preloadResponse));
    return preloadResponse;
  }

  try {
    const networkResponse = await fetch(event.request);
    event.waitUntil(cacheResponse(event.request, networkResponse));
    return networkResponse;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const cachedPage = await cache.match(event.request);
    if (cachedPage) {
      return cachedPage;
    }

    return cache.match(inScopeUrl(OFFLINE_HTML));
  }
}

async function handleAssetRequest(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);

  const networkFetch = fetch(event.request).then((response) => {
    event.waitUntil(cacheResponse(event.request, response));
    return response;
  });

  if (cached) {
    event.waitUntil(networkFetch.catch(() => undefined));
    return cached;
  }

  return networkFetch.catch(async () => cache.match(event.request));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (sameOrigin && ["script", "style", "image", "font"].includes(event.request.destination)) {
    event.respondWith(handleAssetRequest(event));
  }
});
