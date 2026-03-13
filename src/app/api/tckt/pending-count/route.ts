import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy số lượng HĐ chờ thanh toán theo role
export async function GET() {
    try {
        const session = await auth();

        if (
            !session?.user ||
            !["USER2_TCKT", "ADMIN"].includes(session.user.role)
        ) {
            return NextResponse.json({ count: 0 });
        }

        const role = session.user.role;
        let count = 0;

        if (role === "ADMIN") {
            // Admin thấy tổng số HĐ chờ thanh toán
            count = await prisma.hopDong.count({
                where: {
                    ngayDuyetThanhToan: { not: null },
                    daQuyetToan: false,
                },
            });
        } else if (role === "USER2_TCKT") {
            // Đếm HĐ được giao cho mình
            count = await prisma.hopDong.count({
                where: {
                    ngayDuyetThanhToan: { not: null },
                    daQuyetToan: false,
                    nguoiThanhToanId: session.user.id,
                },
            });
        }

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching pending count:", error);
        return NextResponse.json({ count: 0 });
    }
}
