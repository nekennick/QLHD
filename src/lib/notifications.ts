import { prisma } from "@/lib/db";
import webpush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@example.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export type NotificationType =
    | "contract_assigned"
    | "contract_released"
    | "contract_created"
    | "payment_assigned";

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

/**
 * Create an in-app notification and send push notification if user has subscribed
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type, link } = params;

    // Create in-app notification
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            link,
        },
    });

    // Send push notification if user has subscriptions
    await sendPushNotification(userId, { title, message, link });

    return notification;
}

interface PushPayload {
    title: string;
    message: string;
    link?: string;
}

/**
 * Send push notification to all subscribed devices of a user
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
    // Check if VAPID keys are configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.log("VAPID keys not configured, skipping push notification");
        return;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            return;
        }

        const pushPromises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    JSON.stringify({
                        title: payload.title,
                        body: payload.message,
                        icon: "/icon-192x192.png",
                        badge: "/icon-72x72.png",
                        data: {
                            url: payload.link || "/",
                        },
                    })
                );
            } catch (error: unknown) {
                // If subscription is expired or invalid, remove it
                if (error && typeof error === 'object' && 'statusCode' in error) {
                    const webPushError = error as { statusCode: number };
                    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id },
                        });
                    }
                }
                console.error("Error sending push notification:", error);
            }
        });

        await Promise.all(pushPromises);
    } catch (error) {
        console.error("Error in sendPushNotification:", error);
    }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId, // Ensure user owns this notification
        },
        data: {
            isRead: true,
        },
    });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
}
