/* Aimtell Service Worker */
/* This worker handles push notifications via Aimtell */

// Only import Aimtell scripts when available (production environment)
try {
  importScripts('https://cdn.aimtell.com/trackpush/workers/sw.js');
} catch (e) {
  // Aimtell scripts not available in development/preview environments
  console.log('Aimtell worker: Running in standalone mode');
  
  // Basic push notification handler for fallback
  self.addEventListener('push', function(event) {
    if (!event.data) return;
    
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'إشعار جديد',
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/'
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'الحي', options)
      );
    } catch (e) {
      console.error('Push notification error:', e);
    }
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  });
}
