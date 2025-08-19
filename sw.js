const CACHE_NAME = "groningen-aov-v1.0.2"; // ← Update version!
const DATA_CACHE_NAME = "groningen-aov-data-v1.0.2";

// Files to cache for offline functionality - Production file structure
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/results/",               // ← Pretty URL (folder)
  "/results/index.html",     // ← Also cache the actual file
  "/about/",                 // ← Pretty URL (folder)  
  "/about/index.html",       // ← Also cache the actual file
  "/test/",                  // ← Pretty URL (folder)
  "/test/index.html",        // ← Also cache the actual file  "/enhanced-form-utils.js",
  "/js/results-calculator.js",
  "/js/form-utils.js", // Keep for backward compatibility
  "/js/app.js", // Keep for backward compatibility
  "/js/version.js",
  "/style/style.css",
  "/style/pico.blue.min.css",
  "/data/groningen_aad_lookup.json",
  "/data/groningen_aad_metadata.json",
  "/manifest.json",
  "/icons/android/android-launchericon-192-192.png",
  "/icons/android/android-launchericon-512-512.png",
  '/favicon.ico'
];

// Development mode detection
const isDevelopment = location.hostname === 'localhost' || 
                     location.hostname === '127.0.0.1' ||
                     location.hostname.includes('netlify') ||
                     location.hostname.includes('vercel') ||
                     location.hostname.includes('github.io');

// Install event - cache app shell
self.addEventListener("install", (evt) => {

  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (evt) => {

  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - development-friendly caching strategy
self.addEventListener("fetch", (evt) => {
  const { request } = evt;
  const url = new URL(request.url);

  // Handle data requests (JSON files) with network-first strategy
  if (url.pathname.includes("/data/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            console.log("[ServiceWorker] Serving data from cache:", request.url);
            return cache.match(request);
          });
      })
    );
    return;
  }

// DEVELOPMENT MODE: Network-first for app files
if (isDevelopment && (
    url.pathname.endsWith('.html') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css')
  )) {
  
  console.log("[ServiceWorker] DEV MODE: Network-first for", request.url);
  
  evt.respondWith(
    fetch(request)
      .then((response) => {
        // Clone FIRST, before doing anything else
        const responseClone = response.clone();
        
        // If successful, update cache
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            console.log("[ServiceWorker] Updating cache with fresh version:", request.url);
            cache.put(request, responseClone); // ✅ Use the clone
          });
        }
        
        return response; // Return original
      })
      .catch(() => {
        console.log("[ServiceWorker] Network failed, using cache:", request.url);
        return caches.match(request);
      })
  );
  return;
}
  // PRODUCTION MODE: Cache-first for app shell requests
  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((response) => {
        if (response) {
          return response;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          })
.catch(() => {
            // If both cache and network fail
            if (request.destination === "document") {
              console.log("[ServiceWorker] Offline navigation to:", url.pathname);
              
              if (url.pathname.includes('results')) {
                // Try both cached forms of the results page
                return cache.match("/results/index.html")
                  .then(response => response || cache.match("/results/"))
                  .then(response => {
                    if (response) {
                      console.log("[ServiceWorker] Serving results page from cache");
                      return response;
                    }
                    console.log("[ServiceWorker] Results page not found, serving index");
                    return cache.match("/index.html");
                  });
              }
              
              if (url.pathname.includes('about')) {
                return cache.match("/about/index.html")
                  .then(response => response || cache.match("/about/"))
                  .then(response => response || cache.match("/index.html"));
              }
              
              if (url.pathname.includes('test')) {
                return cache.match("/test/index.html")
                  .then(response => response || cache.match("/test/"))
                  .then(response => response || cache.match("/index.html"));
              }
              
              // Default fallback
              return cache.match("/index.html");
            }
          });      });
    })
  );
});

// Handle background sync for potential future offline data submission
self.addEventListener("sync", (evt) => {

  if (evt.tag === "background-sync") {
    evt.waitUntil(
    );
  }
});

// Handle push notifications (for future model updates)
self.addEventListener("push", (evt) => {

  const options = {
    body: evt.data ? evt.data.text() : "New model update available",
    icon: "/icons/android/android-launchericon-192-192.png",
    badge: "/icons/android/android-launchericon-192-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Update",
        icon: "/icons/android/android-launchericon-192-192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/android/android-launchericon-192-192.png",
      },
    ],
  };

  evt.waitUntil(
    self.registration.showNotification("Groningen AOV Calculator", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (evt) => {

  evt.notification.close();

  if (evt.action === "explore") {
    evt.waitUntil(clients.openWindow("/"));
  }
});

// Communicate with main thread
self.addEventListener("message", (evt) => {

  if (evt.data && evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Send version info back to main thread
  if (evt.data && evt.data.type === "GET_VERSION") {
    evt.ports[0].postMessage({
      type: "VERSION",
      version: CACHE_NAME,
    });
  }
});