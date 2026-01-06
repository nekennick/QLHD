import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy danh sách HĐ chờ thanh toán (có ngayDuyetThanhToan, chưa thanh toán)
export async function GET() {
    try {
        const session = await auth();

        // Chỉ TCKT và ADMIN được xem
        if (
            !session?.user ||
            !["USER1_TCKT", "USER2_TCKT", "ADMIN"].includes(session.user.role)
        ) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const role = session.user.role;

        // USER2_TCKT chỉ xem HĐ được giao cho mình
        const whereClause: Record<string, unknown> = {
            ngayDuyetThanhToan: { not: null },
            daQuyetToan: false,
        };

        if (role === "USER2_TCKT") {
            whereClause.nguoiThanhToanId = session.user.id;
        }

        const contracts = await prisma.hopDong.findMany({
            where: whereClause,
            include: {
                nguoiGiao: { select: { id: true, hoTen: true } },
                nguoiThucHien: { select: { id: true, hoTen: true } },
                nguoiThanhToan: { select: { id: true, hoTen: true } },
            },
            orderBy: { ngayDuyetThanhToan: "asc" },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Error fetching pending payments:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
