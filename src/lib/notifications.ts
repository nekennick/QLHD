import { prisma } from "@/lib/db";
import { firebaseAdmin, isFirebaseAdminInitialized } from "./firebase-admin";

export type NotificationType =
    | "contract_assigned"
    | "contract_released"
    | "contract_created"
    | "contract_updated"
    | "payment_assigned";

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

/**
 * Create an in-app notification and send push notification via FCM
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

    // Send push notification if FCM is configured
    await sendPushNotification(userId, { title, message, link });

    return notification;
}

interface PushPayload {
    title: string;
    message: string;
    link?: string;
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
    // Check if Firebase Admin is initialized
    if (!isFirebaseAdminInitialized()) {
        console.log("Firebase Admin not initialized, skipping push notification");
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
                await firebaseAdmin.messaging().send({
                    token: sub.fcmToken,
                    notification: {
                        title: payload.title,
                        body: payload.message,
                    },
                    data: {
                        link: payload.link || "/",
                    },
                    webpush: {
                        fcmOptions: {
                            link: payload.link || "/",
                        },
                        notification: {
                            icon: "/icon-192x192.png",
                            badge: "/icon-72x72.png",
                        },
                    },
                });
            } catch (error: unknown) {
                // If token is expired or invalid, remove it
                if (error && typeof error === 'object' && 'code' in error) {
                    const fcmError = error as { code: string };
                    if (
                        fcmError.code === 'messaging/registration-token-not-registered' ||
                        fcmError.code === 'messaging/invalid-registration-token'
                    ) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id },
                        });
                        console.log("Removed invalid FCM token:", sub.id);
                    }
                }
                console.error("Error sending FCM notification:", error);
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
