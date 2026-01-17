import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy danh sách thông báo của user
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Hỗ trợ limit query param (default: 10, max: 50)
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = Math.min(parseInt(limitParam || "10") || 10, 50);

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
