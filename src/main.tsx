import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

console.log('🚀 MyFinanceTracker starting...');
console.log('📍 Base URL:', import.meta.env.BASE_URL);
console.log('🔧 Mode:', import.meta.env.MODE);

const initializeDarkMode = () => {
  const savedPreference = localStorage.getItem("darkMode");
  const shouldUseDark =
    savedPreference === "true" ||
    (savedPreference === null && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", shouldUseDark);
};

const periodicSyncTag = "mft-periodic-data-sync";
const backgroundSyncTag = "mft-data-sync";

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
      // Compatibility fallback for environments expecting service-worker.js.
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

initializeDarkMode();

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
