// Versiunea cache-ului - modifică la fiecare deploy pentru a forța update
const CACHE_NAME = 'cache-v7.01 (play/pause,🍄, design fixes';

// URLs care vor fi cache-uite la instalare
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png'
];

// Instalare SW nou
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  // Force waiting SW to become active
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.log('Service Worker: Cache Failed', err))
  );
});

// Activare SW nou
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  
  // Preluare control imediat asupra paginilor deschise
  self.clients.claim();
  
  // Curăță cache-urile vechi
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('Service Worker: Clearing Old Cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
  );
});

// Interceptare requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        // Make network request and cache new resources
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});
