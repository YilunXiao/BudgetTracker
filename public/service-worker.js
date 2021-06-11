// Cache front end
const CACHE_NAME = "static-cache-v2";
// cache data
const DATA_CACHE_NAME = "data-cache-v2";

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// install and register service worker
self.addEventListener("install", function (evt) {
    // pre cache image data
    evt.waitUntil(
        caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
    );
      
    // pre cache all static assets
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );
  
    // tell the browser to activate this service worker immediately once it
    // has finished installing
    self.skipWaiting();
});

// remove old data from cache
self.addEventListener("activate", function(evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                // goes through list of keys (cache names)
                // remove cache if name is different (old version)
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log("Removing old cache data", key);
                    return caches.delete(key);
                    }
                })
            );
        })
    );
  
    self.clients.claim();
});

// allow service worker to intercept network requests
self.addEventListener('fetch', function(evt) {
    // code to handle requests goes here
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
            return fetch(evt.request)
            .then(response => {
                // If the response was good, clone it and store it in the cache.
                if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
                }

                return response;
            })
            .catch(err => {
                // Network request failed, try to get it from the cache.
                return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
        );

        return;
    }

    // if the request is not for the API, serve static assets using "offline-first" approach.
    // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
    // serve static files from cache
    evt.respondWith(
        caches.match(evt.request).then(function(response) {
            return response || fetch(evt.request);
        })
    );
});

