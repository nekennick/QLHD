"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Component này xử lý việc đăng ký Service Worker và Push Notification
 * Chạy ẩn, không hiển thị UI
 */
export default function PushManager() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        // Check if push notifications are supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.log("Push notifications not supported");
            return;
        }

        registerServiceWorker();
    }, [session]);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            console.log("Service Worker registered:", registration.scope);

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log("Already subscribed to push");
                return;
            }

            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("Notification permission denied");
                return;
            }

            // Get VAPID public key
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.log("VAPID public key not configured");
                return;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            // Send subscription to server
            await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription.toJSON()),
            });

            console.log("Push subscription successful");
        } catch (error) {
            console.error("Error registering service worker:", error);
        }
    };

    return null; // This component doesn't render anything
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}
