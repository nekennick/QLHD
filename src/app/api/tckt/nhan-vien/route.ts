import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy danh sách user TCKT (USER2_TCKT) để giao việc
export async function GET() {
    try {
        const session = await auth();

        // Chỉ USER1_TCKT và ADMIN được xem
        if (
            !session?.user ||
            !["USER1_TCKT", "ADMIN"].includes(session.user.role)
        ) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: { role: "USER2_TCKT" },
            select: { id: true, hoTen: true, username: true },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching TCKT users:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
