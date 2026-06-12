const CACHE_NAME = "cenotaph-v23";
const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./app.js",
  "./worker.js",
  "./manifest.json",
  "./icon.svg"
];

// Install Event: cache app shell assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: cache-first for app assets, bypass/network-only for WebLLM models and external weight requests
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Bypass service worker cache for model files, weights, and WebLLM compile chunks
  if (
    url.hostname.includes("huggingface.co") ||
    url.pathname.includes(".bin") ||
    url.pathname.includes(".safetensors") ||
    url.pathname.includes(".wasm")
  ) {
    return; // Let browser handle it natively (WebLLM uses its own Cache API/IndexedDB)
  }

  // Handle local app shell files
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // If the network fails (e.g., offline), fall back to the cached version
        return caches.match(e.request);
      })
    );
  } else {
    // For third-party assets (like ESM libraries), use stale-while-revalidate if it's a JS library
    if (url.hostname.includes("esm.sh") || url.hostname.includes("esm.run")) {
      e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(e.request).then((response) => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
              return response;
            })
          );
        })
      );
    }
  }
});
