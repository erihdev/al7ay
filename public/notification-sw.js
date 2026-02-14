// Custom notification handler for Service Worker
// This script is imported into the main service worker via importScripts

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title, {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            dir: 'rtl',
            lang: 'ar',
            vibrate: [100, 50, 100],
            ...options,
        });
    }
});

// Push event - handle incoming push notifications (Migrated from original sw.js)
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    let data = {
        title: 'الحي',
        body: 'لديك تحديث جديد',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: '/' },
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        dir: 'rtl',
        lang: 'ar',
        data: data.data,
        actions: [
            { action: 'open', title: 'فتح' },
            { action: 'close', title: 'إغلاق' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event (Migrated and adapted)
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    if (urlToOpen !== '/') {
                        client.navigate(urlToOpen);
                    }
                    return client.focus();
                }
            }
            // Open a new window if none exists
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});
