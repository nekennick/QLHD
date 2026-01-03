// Firebase Cloud Messaging Service Worker
// Đặt tại thư mục public (root của website)

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config sẽ được inject khi gửi message từ server
// hoặc có thể hard-code ở đây (public info)
const firebaseConfig = {
    apiKey: self.FIREBASE_API_KEY || "",
    authDomain: self.FIREBASE_AUTH_DOMAIN || "",
    projectId: self.FIREBASE_PROJECT_ID || "",
    storageBucket: self.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: self.FIREBASE_APP_ID || ""
};

// Chỉ init nếu có config
if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Xử lý thông báo khi ứng dụng chạy ngầm (background)
    messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Nhận tin nhắn ngầm:', payload);

        const notificationTitle = payload.notification?.title || 'Thông báo';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: payload.data || {},
            actions: [
                { action: 'open', title: 'Xem chi tiết' },
                { action: 'close', title: 'Đóng' }
            ]
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Navigate đến URL từ notification data
    const urlToOpen = event.notification.data?.link || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Kiểm tra nếu đã có window mở
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Mở window mới nếu chưa có
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
