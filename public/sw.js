const CACHE_VERSION = "mft-cache-v8";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_PAGE = "./offline.html";
const APP_SHELL_URLS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./screenshots/dashboard-wide.png",
  "./screenshots/dashboard-narrow.png",
];

function toCacheUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

async function cacheResponse(cacheName, request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function precacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const precacheUrls = APP_SHELL_URLS.map((path) => toCacheUrl(path));

  await Promise.all(
    precacheUrls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // Continue even if one asset cannot be fetched right now.
      }
    })
  );
}

async function broadcast(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(clients.map((client) => client.postMessage(message)));
}

async function handleRefreshCycle(message) {
  await precacheAppShell();
  await broadcast(message);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precacheAppShell();
      await caches.open(RUNTIME_CACHE);
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

      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "mft-data-sync") {
    event.waitUntil(handleRefreshCycle({ type: "PWA_DATA_SYNC_COMPLETE" }));
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "mft-periodic-data-sync") {
    event.waitUntil(handleRefreshCycle({ type: "PWA_PERIODIC_SYNC_COMPLETE" }));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "MyFinanceTracker update";
  const options = {
    body: payload.body || "Fresh data is ready in your tracker.",
    icon: toCacheUrl("./icons/icon-192.png"),
    badge: toCacheUrl("./icons/icon-192.png"),
    data: {
      url: payload.url || toCacheUrl("./"),
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      handleRefreshCycle({ type: "PWA_PUSH_RECEIVED", payload }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || toCacheUrl("./");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url === targetUrl || client.url.startsWith(targetUrl));
      if (existingClient) {
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

async function handleNavigationRequest(event) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cachedPage = await cache.match(toCacheUrl("./index.html"));
  const preloadResponse = await event.preloadResponse;

  if (preloadResponse) {
    await cacheResponse(APP_SHELL_CACHE, event.request, preloadResponse);
    return preloadResponse;
  }

  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse.ok) {
      await cacheResponse(APP_SHELL_CACHE, event.request, networkResponse);
    }
    return networkResponse;
  } catch {
    return cachedPage || (await cache.match(OFFLINE_PAGE));
  }
}

async function handleStaticAssetRequest(event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(event.request);

  const networkFetch = fetch(event.request).then((response) => {
    if (response.ok) {
      event.waitUntil(cacheResponse(RUNTIME_CACHE, event.request, response));
    }
    return response;
  });

  if (cached) {
    event.waitUntil(networkFetch.catch(() => undefined));
    return cached;
  }

  return networkFetch.catch(async () => cache.match(event.request));
}

async function handleDataRequest(event) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse.ok) {
      await cacheResponse(RUNTIME_CACHE, event.request, networkResponse);
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(event.request);
    if (cached) {
      return cached;
    }

    return new Response(JSON.stringify({ offline: true }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });
  }
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

  if (sameOrigin && event.request.destination === "document") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (sameOrigin && requestUrl.pathname.endsWith(".json")) {
    event.respondWith(handleDataRequest(event));
    return;
  }

  if (["script", "style", "image", "font", "manifest"].includes(event.request.destination)) {
    event.respondWith(handleStaticAssetRequest(event));
  }
});
