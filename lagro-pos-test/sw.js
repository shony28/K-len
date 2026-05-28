const CACHE_NAME = 'lagro-pos-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Інсталяція Service Worker та кешування базових файлів
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активація та очищення старого кешу при оновленні версії
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

// Стратегія кешування: Спершу запит до мережі, якщо мережі немає — беремо з кешу
// Оскільки ваш додаток працює з динамічними даними через Google Apps Script,
// зовнішні API-запити не повинні блокувати роботу інтерфейсу.
self.addEventListener('fetch', (e) => {
  // Кешуємо лише сторінку та маніфест, динамічні скрипти (CDN) пропускаємо через мережу
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Якщо все ок, оновлюємо кеш свіжою копією
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Якщо мережі немає, віддаємо файл із кешу
          return caches.match(e.request);
        })
    );
  }
});
