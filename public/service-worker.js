self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/vite.svg', // You can change this to a more appropriate icon
      })
    );
  }
});

// Handle Web Push notifications
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Chex Mix Timer';
    const body = data.body || '';
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/vite.svg',
      })
    );
  } catch (err) {
    // ignore malformed payloads
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const url = '/';
      for (const client of allClients) {
        const normalized = new URL(client.url);
        if (normalized.pathname === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});
