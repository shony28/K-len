const CACHE_NAME = 'task-manager-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Інсталяція: Кешуємо оболонку додатка та іконки
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активація: Видаляємо старий кеш при зміні версії
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

// Обробка запитів: Спочатку мережа, якщо офлайн — беремо стабільну версію з кешу
self.addEventListener('fetch', (e) => {
  // Працюємо лише з локальними файлами додатку (пропускаємо Google Auth API)
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Якщо запит успішний, оновлюємо кеш
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Якщо інтернету немає — підвантажуємо закешований інтерфейс
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Якщо ресурсу немає в кеші (наприклад, динамічний ajax-запит)
            return new Response('Офлайн режим. Перевірте підключення до мережі.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
            });
          });
        })
    );
  }
});