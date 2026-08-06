import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

const initializeDarkMode = () => {
  const savedPreference = localStorage.getItem("darkMode");
  const shouldUseDark =
    savedPreference === "true" ||
    (savedPreference === null && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", shouldUseDark);
};

const periodicSyncTag = "mft-periodic-data-sync";
const backgroundSyncTag = "mft-data-sync";

type WindowControlsOverlay = {
  visible: boolean;
  getTitlebarAreaRect: () => DOMRect;
  addEventListener: (type: "geometrychange", listener: () => void) => void;
  removeEventListener: (type: "geometrychange", listener: () => void) => void;
};

function syncWindowControlsOverlay() {
  const overlay = (navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlay }).windowControlsOverlay;

  if (!overlay) {
    return;
  }

  const updateOverlayMetrics = () => {
    const titlebarArea = overlay.getTitlebarAreaRect();
    const root = document.documentElement;

    root.classList.toggle("window-controls-overlay-active", overlay.visible);
    root.style.setProperty("--titlebar-area-height", overlay.visible ? `${titlebarArea.height}px` : "0px");
    root.style.setProperty("--titlebar-area-width", overlay.visible ? `${titlebarArea.width}px` : "0px");
    root.style.setProperty("--titlebar-area-x", overlay.visible ? `${titlebarArea.x}px` : "0px");
  };

  updateOverlayMetrics();
  overlay.addEventListener("geometrychange", updateOverlayMetrics);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    let registration: ServiceWorkerRegistration;

    try {
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        updateViaCache: "none",
      });
    } catch {
      // Compatibility fallback for tools expecting service-worker.js.
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`, {
        updateViaCache: "none",
      });
    }

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent("mft:sw-updated"));
        }
      });
    });

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    });

    await registerPwaBackgroundFeatures();
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

function base64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function registerPwaBackgroundFeatures() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if ("sync" in registration) {
    await registration.sync.register(backgroundSyncTag).catch((error) => {
      console.warn("Background sync registration failed:", error);
    });
  }

  if ("periodicSync" in registration) {
    await registration.periodicSync
      .register(periodicSyncTag, { minInterval: 6 * 60 * 60 * 1000 })
      .catch((error) => {
        console.warn("Periodic background sync registration failed:", error);
      });
  }

  const pushPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

  if (pushPublicKey && "PushManager" in window && Notification.permission === "granted") {
    const existingSubscription = await registration.pushManager.getSubscription();

    if (!existingSubscription) {
      await registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(pushPublicKey),
        })
        .catch((error) => {
          console.warn("Push subscription failed:", error);
        });
    }
  }
}

function isPwaRefreshMessage(message: unknown) {
  if (!message || typeof message !== "object") {
    return false;
  }

  const messageType = (message as { type?: string }).type;
  return (
    messageType === "PWA_DATA_SYNC_COMPLETE" ||
    messageType === "PWA_PERIODIC_SYNC_COMPLETE" ||
    messageType === "PWA_PUSH_RECEIVED"
  );
}

const CHUNK_RECOVERY_FLAG = "mft:chunk-recovery-attempted";

function isChunkLoadFailure(error: unknown) {
  const message = String((error as { message?: string })?.message || error || "").toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("loading chunk")
  );
}

async function recoverFromChunkLoadFailure() {
  if (sessionStorage.getItem(CHUNK_RECOVERY_FLAG) === "1") {
    return;
  }

  sessionStorage.setItem(CHUNK_RECOVERY_FLAG, "1");

  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
    }
  } catch {
    // Best-effort recovery only.
  }

  window.location.reload();
}

window.addEventListener("error", (event) => {
  if (isChunkLoadFailure(event.error || event.message)) {
    void recoverFromChunkLoadFailure();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (isChunkLoadFailure(event.reason)) {
    void recoverFromChunkLoadFailure();
  }
});

initializeDarkMode();
syncWindowControlsOverlay();

const shouldRegisterServiceWorker =
  "serviceWorker" in navigator && window.isSecureContext;

if (shouldRegisterServiceWorker) {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}

navigator.serviceWorker?.addEventListener("message", (event) => {
  if (isPwaRefreshMessage(event.data)) {
    window.dispatchEvent(new CustomEvent("mft:pwa-refresh", { detail: event.data }));
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
