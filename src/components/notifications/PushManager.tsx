"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Firebase config từ environment variables
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

/**
 * Component này xử lý việc đăng ký Firebase Cloud Messaging
 * Chạy ẩn, không hiển thị UI
 */
export default function PushManager() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        // Check if Firebase is configured
        if (!firebaseConfig.apiKey) {
            console.log("Firebase not configured");
            return;
        }

        // Check if push notifications are supported
        if (!("serviceWorker" in navigator) || !("Notification" in window)) {
            console.log("Push notifications not supported");
            return;
        }

        initializeFCM();
    }, [session]);

    const initializeFCM = async () => {
        try {
            // Dynamically import Firebase to avoid SSR issues
            const { initializeApp } = await import("firebase/app");
            const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const messaging = getMessaging(app);

            // Register service worker
            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            console.log("FCM Service Worker registered:", registration.scope);

            // Check if already subscribed
            const permission = Notification.permission;
            if (permission === "denied") {
                console.log("Notification permission denied");
                return;
            }

            // Request permission if not granted
            if (permission !== "granted") {
                const newPermission = await Notification.requestPermission();
                if (newPermission !== "granted") {
                    console.log("User declined notification permission");
                    return;
                }
            }

            // Get FCM token
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.log("VAPID key not configured");
                return;
            }

            const token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration,
            });

            if (token) {
                console.log("FCM Token obtained");

                // Send token to server
                await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fcmToken: token }),
                });

                // Token sent to server
                console.log("FCM subscription successful");
            } else {
                console.log("Failed to get FCM token");
            }

            // Handle foreground messages
            onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload);

                // Show notification manually for foreground messages
                if (Notification.permission === "granted" && payload.notification) {
                    new Notification(payload.notification.title || "Thông báo", {
                        body: payload.notification.body,
                        icon: "/icon-192x192.png",
                    });
                }
            });

        } catch (error) {
            console.error("Error initializing FCM:", error);
        }
    };

    return null; // This component doesn't render anything
}
