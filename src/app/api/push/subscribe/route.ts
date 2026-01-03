import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Đăng ký nhận push notification via FCM
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fcmToken } = body;

        if (!fcmToken) {
            return NextResponse.json(
                { message: "Thiếu FCM token" },
                { status: 400 }
            );
        }

        // Upsert subscription (update if exists, create if not)
        await prisma.pushSubscription.upsert({
            where: { fcmToken },
            update: {
                userId: session.user.id,
            },
            create: {
                userId: session.user.id,
                fcmToken,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving FCM subscription:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}

// DELETE - Hủy đăng ký push notification
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fcmToken } = body;

        if (!fcmToken) {
            return NextResponse.json(
                { message: "Thiếu FCM token" },
                { status: 400 }
            );
        }

        await prisma.pushSubscription.deleteMany({
            where: {
                fcmToken,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting FCM subscription:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
