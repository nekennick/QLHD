import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Đăng ký nhận push notification
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint, keys } = body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json(
                { message: "Thiếu thông tin subscription" },
                { status: 400 }
            );
        }

        // Upsert subscription (update if exists, create if not)
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                userId: session.user.id,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
            create: {
                userId: session.user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving push subscription:", error);
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
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { message: "Thiếu endpoint" },
                { status: 400 }
            );
        }

        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting push subscription:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
