const CACHE_NAME = 'traffic-account-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Інсталяція: кешуємо інтерфейс та іконки
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активація: очищаємо старий кеш, якщо версія змінилася
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

// Обробка запитів: спочатку мережа, якщо офлайн — віддаємо з кешу
self.addEventListener('fetch', (e) => {
  // Обробляємо тільки локальні ресурси (не чіпаємо зовнішні скрипти Google Auth чи CDN Tailwind)
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Якщо запит успішний, оновлюємо копію в кеші
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Якщо інтернет зник — беремо з кешу
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Якщо ресурсу немає в кеші (наприклад, якась внутрішня сторінка)
            return new Response('Офлайн режим. Перевірте з’єднання з мережею.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
            });
          });
        })
    );
  }
});