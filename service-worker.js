// service-worker.js (simple working version)
const CACHE_NAME = 'alawusa-heritage-v1';

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  self.clients.claim();
});

// Fetch event (optional - for offline support)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

// Push event (will work when you add push later)
self.addEventListener('push', event => {
  console.log('Push event received');
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: 'Alawusa heritage icon - Icon.png',
    badge: 'Alawusa heritage icon - Icon.png',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Alawusa Heritage', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data.url || 'userorders.html';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});