const CACHE_NAME = "groningen-aov-v1.1.2"; // Update this on new releases
const DATA_CACHE_NAME = "groningen-aov-data-v1.1.2";
const OFFLINE_FALLBACK = '/offline.html'; 

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/results/",
  "/results/index.html",
  "/about/",
  "/about/index.html", 
  "/test/",
  "/test/index.html",
  "/js/results-calculator.js",
  "/js/form-utils.js",
  "/js/app.js",
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

// Install event - cache app shell with better error handling
self.addEventListener("install", (evt) => {
  console.log('[ServiceWorker] Install event');
  
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching app shell');
        // Use Promise.allSettled to prevent one failed cache from breaking everything
        return Promise.allSettled(
          FILES_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
              // Don't let one failed resource break the whole install
              return null;
            });
          })
        );
      })
      .then((results) => {
        const failed = results.filter(r => r.status === 'rejected').length;
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[ServiceWorker] Cached ${succeeded}/${FILES_TO_CACHE.length} files. ${failed} failed.`);
        
        // Only proceed if we got the essential files
        if (succeeded < FILES_TO_CACHE.length / 2) {
          throw new Error('Too many cache failures during install');
        }
      })
      .catch((err) => {
        console.error('[ServiceWorker] Cache install failed:', err);
        // Don't skip waiting if install failed
        throw err;
      })
  );

  // Only skip waiting if install succeeded
  self.skipWaiting();
});

// Activate event - clean up old caches with better error handling
self.addEventListener("activate", (evt) => {
  console.log('[ServiceWorker] Activate event');
  
  evt.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.allSettled(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then((results) => {
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
          console.warn(`[ServiceWorker] Failed to delete ${failed} old caches`);
        }
      })
      .catch((err) => {
        console.error('[ServiceWorker] Cache cleanup failed:', err);
        // Don't prevent activation due to cleanup failures
      })
  );

  self.clients.claim();
});

// Enhanced fetch event with comprehensive error handling
self.addEventListener("fetch", (evt) => {
  const { request } = evt;
  const url = new URL(request.url);

  // Skip non-http requests (chrome-extension:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle data requests (JSON files) with network-first strategy
  if (url.pathname.includes("/data/")) {
    evt.respondWith(handleDataRequest(request));
    return;
  }

  // Development vs Production strategy
  if (isDevelopment && (
      url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css')
    )) {
    evt.respondWith(handleDevelopmentRequest(request));
  } else {
    evt.respondWith(handleProductionRequest(request));
  }
});

// Network-first strategy for data files with robust fallbacks
async function handleDataRequest(request) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    
    try {
      const response = await fetch(request);
      
      if (response && response.status === 200) {
        // Clone before caching
        const responseClone = response.clone();
        cache.put(request.url, responseClone).catch(err => {
          console.warn('[ServiceWorker] Failed to cache data:', err);
        });
      }
      
      return response;
    } catch (networkError) {
      console.log('[ServiceWorker] Network failed for data, trying cache:', request.url);
      
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If both network and cache fail, return a meaningful error
      console.error('[ServiceWorker] Both network and cache failed for:', request.url);
      return new Response(
        JSON.stringify({ 
          error: 'Data temporarily unavailable', 
          offline: true 
        }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (cacheError) {
    console.error('[ServiceWorker] Cache operation failed:', cacheError);
    
    // Last resort: try direct fetch
    try {
      return await fetch(request);
    } catch (fetchError) {
      return new Response(
        JSON.stringify({ 
          error: 'Service unavailable', 
          message: 'Please check your connection' 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Network-first strategy for development with timeout
async function handleDevelopmentRequest(request) {
  console.log("[ServiceWorker] DEV MODE: Network-first for", request.url);
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(request, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response && response.status === 200) {
      // Cache successful responses
      const responseClone = response.clone();
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, responseClone))
        .catch(err => console.warn('[ServiceWorker] Cache update failed:', err));
    }
    
    return response;
    
  } catch (networkError) {
    console.log('[ServiceWorker] Network failed, using cache:', request.url);
    
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback for HTML pages
      if (request.destination === 'document') {
        return await getFallbackPage(request, cache);
      }
      
      // For other resources, return a basic error
      throw new Error('Resource not available offline');
      
    } catch (cacheError) {
      console.error('[ServiceWorker] Cache fallback failed:', cacheError);
      return createErrorResponse(request);
    }
  }
}

// Cache-first strategy for production with comprehensive fallbacks
async function handleProductionRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(request);
    
    if (response) {
      // Background refresh for critical resources
      if (request.destination === 'document' || 
          request.url.includes('.json') || 
          request.url.includes('version')) {
        
        fetch(request)
          .then(freshResponse => {
            if (freshResponse && freshResponse.status === 200) {
              cache.put(request, freshResponse.clone());
            }
          })
          .catch(() => {
            // Silent fail for background updates
          });
      }
      
      return response;
    }

    // Not in cache, try network
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone).catch(err => {
          console.warn('[ServiceWorker] Failed to cache:', err);
        });
      }
      
      return networkResponse;
      
    } catch (networkError) {
      console.log('[ServiceWorker] Network failed:', request.url);
      
      // Try to find a suitable fallback
      if (request.destination === 'document') {
        return await getFallbackPage(request, cache);
      }
      
      throw networkError;
    }
    
  } catch (error) {
    console.error('[ServiceWorker] Request handling failed:', error);
    return createErrorResponse(request);
  }
}

// Get appropriate fallback page based on URL
async function getFallbackPage(request, cache) {
  const url = new URL(request.url);
  
  // Try specific page fallbacks first
  if (url.pathname.includes('results')) {
    const fallback = await cache.match('/results/index.html');
    if (fallback) return fallback;
  }
  
  if (url.pathname.includes('about')) {
    const fallback = await cache.match('/about/index.html');
    if (fallback) return fallback;
  }
  
  if (url.pathname.includes('test')) {
    const fallback = await cache.match('/test/index.html');
    if (fallback) return fallback;
  }
  
  // Try main index.html
  const indexFallback = await cache.match('/index.html') || 
                       await cache.match('/');
  
  if (indexFallback) {
    return indexFallback;
  }
  
  // Last resort: create a minimal offline page
  return createOfflinePage();
}

// Create error response based on request type
function createErrorResponse(request) {
  if (request.destination === 'document') {
    return createOfflinePage();
  }
  
  if (request.url.includes('.json')) {
    return new Response(
      JSON.stringify({ 
        error: 'Data unavailable offline',
        timestamp: Date.now()
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // For other resources
  return new Response('Resource unavailable', { 
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Create a minimal offline page
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Offline - Groningen AOV Calculator</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
        .offline-message { max-width: 600px; margin: 2rem auto; }
        button { 
          background: #0066cc; color: white; border: none; 
          padding: 1rem 2rem; border-radius: 4px; cursor: pointer; 
        }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <h1>You're Offline</h1>
        <p>The Groningen AOV Calculator is temporarily unavailable.</p>
        <p>Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync
self.addEventListener("sync", (evt) => {
  if (evt.tag === "background-sync") {
    evt.waitUntil(
      // Future: Handle offline data submission
      Promise.resolve()
    );
  }
});

// Enhanced message handling
self.addEventListener("message", (evt) => {
  if (evt.data && evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (evt.data && evt.data.type === "GET_VERSION") {
    evt.ports[0].postMessage({
      type: "VERSION",
      version: CACHE_NAME,
      timestamp: Date.now()
    });
  }
  
  // New: Cache health check
  if (evt.data && evt.data.type === "CACHE_HEALTH_CHECK") {
    caches.has(CACHE_NAME)
      .then(exists => {
        evt.ports[0].postMessage({
          type: "CACHE_HEALTH",
          healthy: exists,
          cacheName: CACHE_NAME
        });
      })
      .catch(() => {
        evt.ports[0].postMessage({
          type: "CACHE_HEALTH",
          healthy: false,
          error: true
        });
      });
  }
});

// Global error handler to prevent crashes
self.addEventListener('error', (evt) => {
  console.error('[ServiceWorker] Global error:', evt.error);
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (evt) => {
  console.error('[ServiceWorker] Unhandled promise rejection:', evt.reason);
  evt.preventDefault(); // Prevent the default handling
});