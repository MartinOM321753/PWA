const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache';

const APP_SHELL = [
  './index.html',
  './calendar.html',
  './form.html',
  './main.js',
];

// ---- INSTALACIÓN ----
self.addEventListener('install', e => {
  console.log('Service Worker: Instalando...');
  e.waitUntil(
    caches.open(STATIC_CACHE).then(async cache => {
      console.log('Archivos en caché estático');
      for (const file of APP_SHELL) {
        try {
          await cache.add(file);
        } catch (err) {
          console.warn('⚠️ No se pudo cachear', file, err);
        }
      }
    })
  );
});

// ---- ACTIVACIÓN ----
self.addEventListener('activate', e => {
  console.log('Service Worker: Activado');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
});

// ---- FETCH (Cache First, Network Fallback) ----
self.addEventListener('fetch', e => {
  const request = e.request;

  e.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Retorna desde caché
        return cachedResponse;
      }

      // Si no está en caché, intenta obtener de la red
      return fetch(request).then(networkResponse => {
        // Guardamos dinámicamente solo recursos de FullCalendar / Select2
        if (request.url.includes('fullcalendar') || request.url.includes('select2')) {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, networkResponse.clone());
            console.log('Guardado en caché dinámico:', request.url);
            return networkResponse;
          });
        }

        // Para otros recursos, solo devolvemos la respuesta
        return networkResponse;
      }).catch(() => {
        // Fallback si no hay conexión
        return caches.match('offline.html');
      });
    })
  );
});

