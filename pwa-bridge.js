// --- Money Budgeter PWA Bridge ---
// Registers the service worker and backs up all localStorage data periodically.
(function(){
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js");
    });
  }

  function swPost(message) {
    try {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
      navigator.serviceWorker.controller.postMessage(message);
    } catch {}
  }

  function gatherAllLocalStorage() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
    } catch {}
    return data;
  }

  function backupNow(){
    const raw = gatherAllLocalStorage();
    // Try to parse a few common keys into objects/numbers for nicer restore (optional)
    const parsed = {};
    for (const [k,v] of Object.entries(raw)) {
      try {
        parsed[k] = JSON.parse(v);
      } catch {
        parsed[k] = v;
      }
    }
    swPost({ type: "SAVE_DATA", payload: parsed });
  }

  // Periodic and on-exit backup
  setInterval(backupNow, 15000);
  window.addEventListener("beforeunload", backupNow);

  // Ask SW to restore once ready
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(() => {
      swPost({ type: "LOAD_DATA" });
    });
    navigator.serviceWorker.addEventListener("message", (evt) => {
      if (evt.data && evt.data.type === "LOAD_DATA_RESULT" && evt.data.payload) {
        const restored = evt.data.payload;
        // Only set keys that are missing, to avoid overwriting active sessions
        try {
          for (const [k,v] of Object.entries(restored)) {
            if (localStorage.getItem(k) === null) {
              const val = typeof v === "object" ? JSON.stringify(v) : String(v);
              localStorage.setItem(k, val);
            }
          }
        } catch {}
      }
    });
  }
})();
