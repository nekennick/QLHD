import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy số lượng HĐ chờ thanh toán theo role
export async function GET() {
    try {
        const session = await auth();

        if (
            !session?.user ||
            !["USER1_TCKT", "USER2_TCKT", "ADMIN"].includes(session.user.role)
        ) {
            return NextResponse.json({ count: 0 });
        }

        const role = session.user.role;
        let count = 0;

        if (role === "USER1_TCKT") {
            // Đếm HĐ chờ thanh toán CHƯA được giao (nguoiThanhToanId = null)
            count = await prisma.hopDong.count({
                where: {
                    ngayDuyetThanhToan: { not: null },
                    daQuyetToan: false,
                    nguoiThanhToanId: null,
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
        } else if (role === "ADMIN") {
            // Admin thấy tổng số HĐ chờ thanh toán
            count = await prisma.hopDong.count({
                where: {
                    ngayDuyetThanhToan: { not: null },
                    daQuyetToan: false,
                },
            });
        }

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching pending count:", error);
        return NextResponse.json({ count: 0 });
    }
}
