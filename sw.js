/* Service worker for the A320 Fleet Configuration app.

   Purpose: make the app open reliably WITHOUT a connection (in flight).
   Without this, iOS decides on its own whether to keep the page in its HTTP
   cache, which is why the app sometimes failed to load airborne.

   Strategy
     - App shell (HTML, icons)  : cache-first, refreshed in the background.
                                  Always opens offline; picks up new versions
                                  on the next launch.
     - fleet-config.enc (data)  : network-first, falling back to the cached
                                  copy when offline. The fallback is tagged
                                  with an "X-From-Cache" header so the app can
                                  honestly report "offline" instead of
                                  claiming the data is freshly synced.

   IMPORTANT: bump CACHE_VERSION whenever you publish changed files, otherwise
   devices may keep serving the previous copy from cache.
*/
"use strict";

var CACHE_VERSION = "fleet-20260719-223801";

var DATA = "fleet-config.enc";
var SHELL = [
  "./",
  "index.html",
  "collector.html",
  "manifest.json",
  "manifest-collector.json",
  "UI/icon1.png",
  "UI/icon1-180.png",
  "UI/icon3.png",
  "UI/icon3-180.png",
  "UI/carbon.png"
];

/* ---- Install: pre-cache the shell and the encrypted data ----
   Added one by one so a single missing file cannot abort the whole install. */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return Promise.all(SHELL.concat([DATA]).map(function (url) {
        return cache.add(url).catch(function () { /* keep going */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* ---- Activate: drop caches from previous versions ---- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Re-wrap a cached response with a marker header so the page knows the data
   came from cache (i.e. we are offline) rather than from the network. */
function tagAsCached(response) {
  return response.blob().then(function (body) {
    var headers = new Headers(response.headers);
    headers.set("X-From-Cache", "1");
    return new Response(body, { status: 200, statusText: "OK (cached)", headers: headers });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;   // never interfere with other origins

  /* ---- Encrypted fleet data: network first, cached copy as the safety net ---- */
  if (url.pathname.indexOf(DATA) !== -1) {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(DATA, copy); });
        }
        return response;
      }).catch(function () {
        return caches.open(CACHE_VERSION).then(function (cache) {
          return cache.match(DATA, { ignoreSearch: true }).then(function (hit) {
            if (hit) return tagAsCached(hit);
            return new Response("", { status: 504, statusText: "Offline and no cached fleet data" });
          });
        });
      })
    );
    return;
  }

  /* ---- App shell: serve from cache instantly, refresh in the background ---- */
  event.respondWith(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.match(request, { ignoreSearch: true }).then(function (hit) {
        var network = fetch(request).then(function (response) {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(function () { return hit; });
        return hit || network;   // cached copy wins for speed/offline; network updates it for next time
      });
    })
  );
});
