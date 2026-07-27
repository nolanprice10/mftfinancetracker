const CACHE_NAME = "mft-cache-v3";
const OFFLINE_HTML = "index.html";
const DATA_SYNC_TAG = "mft-data-sync";
const PERIODIC_SYNC_TAG = "mft-periodic-data-sync";
const APP_SHELL_PATHS = [
  "",
  "index.html",
  "offline.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "dashboard",
  "transactions",
  "accounts",
  "goals",
  "investments",
  "recommendations",
  "settings",
  "risk",
  "compare",
  "quant-lab",
];

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

async function refreshAppShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    APP_SHELL_PATHS.map(async (path) => {
      try {
        const url = inScopeUrl(path);
        const response = await fetch(url, { cache: "no-store" });

        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // Ignore individual shell refresh failures so the rest of the cycle can continue.
      }
    })
  );
}

async function broadcast(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(clients.map((client) => client.postMessage(message)));
}

async function handleRefreshCycle(message) {
  await refreshAppShell();
  await broadcast(message);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const shellUrls = [
        inScopeUrl(""),
        inScopeUrl("index.html"),
        inScopeUrl("offline.html"),
        inScopeUrl("manifest.json"),
        inScopeUrl("icons/icon-192.png"),
        inScopeUrl("icons/icon-512.png"),
      ];

      await Promise.all(
        shellUrls.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-store" });

            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch {
            // Ignore individual precache failures so install still succeeds.
          }
        })
      );
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

self.addEventListener("sync", (event) => {
  if (event.tag === DATA_SYNC_TAG) {
    event.waitUntil(handleRefreshCycle({ type: "PWA_DATA_SYNC_COMPLETE" }));
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
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
    icon: inScopeUrl("icons/icon-192.png"),
    badge: inScopeUrl("icons/icon-192.png"),
    data: {
      url: payload.url || inScopeUrl(""),
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

  const targetUrl = event.notification.data?.url || inScopeUrl("");

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
