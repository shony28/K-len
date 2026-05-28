const CACHE_NAME = 'wood-measurer-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Інсталяція: Кешуємо всі ресурси для роботи офлайн
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активація: Видаляємо старі версії кешу при оновленні додатку
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обробка запитів: Спочатку беремо з кешу для миттєвого запуску офлайн
self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Повертаємо з кешу і паралельно оновлюємо кеш із мережі (Stale-While-Revalidate)
          fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          }).catch(() => { /* Ігноруємо помилки мережі офлайн */ });
          
          return cachedResponse;
        }
        return fetch(e.request);
      })
    );
  }
});