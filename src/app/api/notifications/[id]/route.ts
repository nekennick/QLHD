import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notifications";

// PATCH - Đánh dấu thông báo đã đọc
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await markNotificationAsRead(id, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
