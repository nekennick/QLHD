import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

// GET - Lấy số lượng thông báo chưa đọc
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const count = await getUnreadNotificationCount(session.user.id);

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
