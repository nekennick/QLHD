import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notifications";

// POST - Đánh dấu tất cả thông báo đã đọc
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await markAllNotificationsAsRead(session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
