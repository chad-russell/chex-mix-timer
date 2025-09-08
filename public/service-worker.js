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
