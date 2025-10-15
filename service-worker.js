// --- Money Budgeter Service Worker ---
const CACHE_VERSION = "mb-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/repeat.html",
  "/repeat_add.html",
  "/style.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// ======== Data backup in IndexedDB ========
const DB_NAME = "mb-db";
const STORE = "backup";

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, value, ts: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

// Messages: SAVE_DATA (store), LOAD_DATA (return)
self.addEventListener("message", async (event) => {
  const msg = event.data || {};
  if (msg.type === "SAVE_DATA") {
    try { await idbPut("mb:data", msg.payload); } catch(e) {}
  }
  if (msg.type === "LOAD_DATA") {
    const data = await idbGet("mb:data");
    const target = event.source;
    if (target && "postMessage" in target) {
      target.postMessage({ type: "LOAD_DATA_RESULT", payload: data });
    } else {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach(c => c.postMessage({ type: "LOAD_DATA_RESULT", payload: data }));
    }
  }
});
