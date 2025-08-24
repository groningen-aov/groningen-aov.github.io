// PWA Debug Utilities - Add to your main app or run in console
// These functions help diagnose and fix PWA hanging issues

class PWADebugger {
  constructor() {
    this.log = (msg) => console.log(`[PWA Debug] ${msg}`);
    this.warn = (msg) => console.warn(`[PWA Debug] ${msg}`);
    this.error = (msg) => console.error(`[PWA Debug] ${msg}`);
  }

  // Check overall PWA health
  async checkHealth() {
    this.log('🔍 Running PWA health check...');
    
    const health = {
      serviceWorker: await this.checkServiceWorker(),
      cache: await this.checkCache(),
      manifest: await this.checkManifest(),
      network: await this.checkNetwork()
    };

    this.log('📊 Health check results:', health);
    
    // Provide recommendations
    this.provideRecommendations(health);
    
    return health;
  }

  // Check service worker status
  async checkServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, status: 'not_supported' };
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        return { supported: true, status: 'not_registered' };
      }

      const sw = registration.active || registration.installing || registration.waiting;
      
      return {
        supported: true,
        status: 'registered',
        state: sw?.state || 'unknown',
        hasActive: !!registration.active,
        hasWaiting: !!registration.waiting,
        hasInstalling: !!registration.installing,
        scope: registration.scope,
        updateViaCache: registration.updateViaCache
      };
    } catch (error) {
      return { supported: true, status: 'error', error: error.message };
    }
  }

  // Check cache health
  async checkCache() {
    if (!('caches' in window)) {
      return { supported: false };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheData = {};

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheData[cacheName] = {
          size: keys.length,
          keys: keys.slice(0, 5).map(req => req.url) // First 5 URLs
        };
      }

      return {
        supported: true,
        caches: cacheData,
        totalCaches: cacheNames.length
      };
    } catch (error) {
      return { supported: true, error: error.message };
    }
  }

  // Check manifest
  async checkManifest() {
    try {
      const response = await fetch('/manifest.json');
      if (!response.ok) {
        return { found: false, status: response.status };
      }
      
      const manifest = await response.json();
      return {
        found: true,
        name: manifest.name,
        version: manifest.version,
        startUrl: manifest.start_url,
        display: manifest.display
      };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  // Check network connectivity
  async checkNetwork() {
    const online = navigator.onLine;
    
    if (!online) {
      return { online: false, speed: 'offline' };
    }

    try {
      const start = performance.now();
      await fetch('/manifest.json', { method: 'HEAD' });
      const end = performance.now();
      const latency = end - start;

      return {
        online: true,
        latency: Math.round(latency),
        speed: latency < 100 ? 'fast' : latency < 500 ? 'medium' : 'slow'
      };
    } catch (error) {
      return { 
        online: true, 
        reachable: false, 
        error: error.message 
      };
    }
  }

  // Provide actionable recommendations
  provideRecommendations(health) {
    this.log('💡 Recommendations:');

    if (!health.serviceWorker.supported) {
      this.warn('Service Workers not supported in this browser');
      return;
    }

    if (health.serviceWorker.status === 'not_registered') {
      this.warn('❌ Service Worker not registered - PWA won\'t work offline');
      this.log('💡 Check that sw.js exists and registration code runs');
    }

    if (health.serviceWorker.hasWaiting) {
      this.warn('⏳ Service Worker update waiting - page may be stale');
      this.log('💡 Reload the page to activate new version');
    }

    if (health.cache.totalCaches === 0) {
      this.warn('❌ No caches found - app won\'t work offline');
      this.log('💡 Service worker may not be caching properly');
    }

    if (health.cache.totalCaches > 5) {
      this.warn('⚠️ Many caches found - may indicate cleanup issues');
      this.log('💡 Old caches might not be cleaning up properly');
    }

    if (!health.manifest.found) {
      this.warn('❌ Manifest not found - PWA install won\'t work');
    }

    if (!health.network.online) {
      this.log('📴 You\'re offline - testing offline functionality');
    }

    if (health.network.speed === 'slow') {
      this.log('🐌 Slow network detected - offline-first is important');
    }
  }

  // Force refresh everything
  async forceRefresh() {
    this.log('🔄 Force refreshing PWA...');

    try {
      // Unregister service worker
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        this.log('✅ Service worker unregistered');
      }

      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      this.log(`✅ Cleared ${cacheNames.length} caches`);

      // Clear localStorage (optional)
      localStorage.clear();
      sessionStorage.clear();
      this.log('✅ Cleared storage');

      this.log('🔄 Reloading page...');
      window.location.reload(true);

    } catch (error) {
      this.error(`Force refresh failed: ${error.message}`);
    }
  }

  // Test cache functionality
  async testCache() {
    this.log('🧪 Testing cache functionality...');

    try {
      const cacheName = 'test-cache';
      const cache = await caches.open(cacheName);
      
      // Test write
      const testResponse = new Response('test data');
      await cache.put('/test-url', testResponse);
      
      // Test read
      const retrieved = await cache.match('/test-url');
      const text = await retrieved.text();
      
      // Cleanup
      await caches.delete(cacheName);
      
      if (text === 'test data') {
        this.log('✅ Cache read/write working');
        return true;
      } else {
        this.error('❌ Cache read/write failed');
        return false;
      }
    } catch (error) {
      this.error(`Cache test failed: ${error.message}`);
      return false;
    }
  }

  // Get service worker version
  async getVersion() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.active) {
        return 'No active service worker';
      }

      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data.version || 'Version not available');
        };
        
        registration.active.postMessage(
          { type: 'GET_VERSION' }, 
          [channel.port2]
        );
      });
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  // Monitor service worker updates
  monitorUpdates() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'VERSION') {
        this.log(`Service Worker version: ${event.data.version}`);
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.log('🔄 Service Worker controller changed - new version active');
    });

    // Check for updates
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.addEventListener('updatefound', () => {
          this.log('🆕 Service Worker update found');
          
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.log('💫 New version ready - reload to update');
            }
          });
        });
      }
    });
  }
}

// Auto-initialize debugger
const pwaDebugger = new PWADebugger();

// Add helpful shortcuts to window for console use
if (typeof window !== 'undefined') {
  window.pwaDebug = {
    // Quick health check
    check: () => pwaDebugger.checkHealth(),
    
    // Nuclear option - clears everything
    reset: () => pwaDebugger.forceRefresh(),
    
    // Test if cache is working
    testCache: () => pwaDebugger.testCache(),
    
    // Get current version
    version: () => pwaDebugger.getVersion(),
    
    // Start monitoring
    monitor: () => pwaDebugger.monitorUpdates(),
    
    // Show all available commands
    help: () => {
      console.log(`
PWA Debug Commands:
==================
pwaDebug.check()     - Full health check
pwaDebug.reset()     - Clear everything and reload  
pwaDebug.testCache() - Test cache functionality
pwaDebug.version()   - Get service worker version
pwaDebug.monitor()   - Start monitoring updates
pwaDebug.help()      - Show this help

Examples:
---------
// Check if PWA is healthy
await pwaDebug.check()

// If PWA is hanging/broken
pwaDebug.reset()

// Get current version
await pwaDebug.version()
      `);
    }
  };
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWADebugger;
}