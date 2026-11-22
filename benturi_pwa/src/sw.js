import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Forzar activación inmediata del nuevo Service Worker tras cada despliegue en Render
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

cleanupOutdatedCaches();

// Precarga los assets que vite-plugin-pwa inyecte
precacheAndRoute(self.__WB_MANIFEST || []);

// Escuchar notificaciones Push
self.addEventListener('push', (event) => {
  let data = { title: 'Método Bénturi', body: 'Conecta con tu imagen cuántica. Es tu momento.', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Al hacer click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la app ya está abierta, enfocamos
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrimos una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
