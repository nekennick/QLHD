// Service Worker for Push Notifications
// This file should be placed in the public folder

self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();

        const options = {
            body: data.body || '',
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: data.data || {},
            actions: [
                { action: 'open', title: 'Xem chi tiết' },
                { action: 'close', title: 'Đóng' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Thông báo', options)
        );
    } catch (error) {
        console.error('Error parsing push data:', error);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Navigate to the URL from notification data
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Open a new window if no existing window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle service worker activation
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
