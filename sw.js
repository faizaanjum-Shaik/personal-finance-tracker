// ============================================================
// Personal Finance Tracker — sw.js  (Service Worker)
// Cache-first strategy for all static assets.
// Bump CACHE_NAME version when you update any file.
// ============================================================

const CACHE_NAME = "finance-tracker-v2";

/** All files that must be available offline after first load. */
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon.svg",
    // Chart.js from the same CDN version pinned in index.html
    "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"
];

// ── Install: pre-cache all static assets ─────────────────────
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately without waiting for old SW to finish
    self.skipWaiting();
});

// ── Activate: delete old caches ──────────────────────────────
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names
                    .filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) { return caches.delete(name); })
            );
        })
    );
    // Take control of all open pages immediately
    self.clients.claim();
});

// ── Fetch: cache-first, fall back to network ─────────────────
self.addEventListener("fetch", function (event) {
    // Only handle GET requests
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) return cached;

            // Not in cache: fetch from network and cache the result
            return fetch(event.request)
                .then(function (response) {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, copy);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    // Offline and not cached: return the shell page for navigation
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
        })
    );
});
