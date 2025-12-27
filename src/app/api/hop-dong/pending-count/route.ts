import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy số lượng HĐ được giao cho USER2 hiện tại
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "USER2") {
            return NextResponse.json({ count: 0 });
        }

        // Đếm HĐ được giao cho mình mà chưa hoàn thiện nhập liệu
        // (chưa có tenHopDong hoặc chưa có giaTriHopDong)
        const count = await prisma.hopDong.count({
            where: {
                nguoiThucHienId: session.user.id,
                OR: [
                    { tenHopDong: null },
                    { giaTriHopDong: null },
                    { ngayKy: null },
                ],
            },
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching assigned contracts count:", error);
        return NextResponse.json({ count: 0 });
    }
}
