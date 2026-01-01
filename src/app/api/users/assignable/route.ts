import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/users/assignable
 * Lấy danh sách users có thể nhận chuyển giao hợp đồng
 * Query params:
 * - contractId: ID hợp đồng (để check xem có phải TCKT không)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const contractId = searchParams.get("contractId");

        // Chỉ lãnh đạo mới có quyền xem danh sách để chuyển giao
        const currentUserRole = session.user.role;
        if (currentUserRole !== "USER1" && currentUserRole !== "USER1_TCKT") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo mới có quyền chuyển giao hợp đồng" },
                { status: 403 }
            );
        }

        let assignableUsers: { id: string; hoTen: string; role: string }[];

        if (currentUserRole === "USER1") {
            // Lãnh đạo hợp đồng chuyển giao cho nhân viên hợp đồng (USER2)
            assignableUsers = await prisma.user.findMany({
                where: {
                    role: "USER2",
                },
                select: {
                    id: true,
                    hoTen: true,
                    role: true,
                },
                orderBy: {
                    hoTen: "asc",
                },
            });
        } else if (currentUserRole === "USER1_TCKT") {
            // Lãnh đạo TCKT chuyển giao cho nhân viên TCKT (USER2_TCKT)
            // Chỉ chuyển giao được hợp đồng đã có ngayDuyetThanhToan
            if (contractId) {
                const contract = await prisma.hopDong.findUnique({
                    where: { id: contractId },
                    select: { ngayDuyetThanhToan: true },
                });

                if (!contract?.ngayDuyetThanhToan) {
                    return NextResponse.json(
                        { message: "Hợp đồng chưa đến giai đoạn thanh toán" },
                        { status: 400 }
                    );
                }
            }

            assignableUsers = await prisma.user.findMany({
                where: {
                    role: "USER2_TCKT",
                },
                select: {
                    id: true,
                    hoTen: true,
                    role: true,
                },
                orderBy: {
                    hoTen: "asc",
                },
            });
        } else {
            assignableUsers = [];
        }

        return NextResponse.json({ users: assignableUsers });
    } catch (error) {
        console.error("Error fetching assignable users:", error);
        return NextResponse.json(
            { message: "Lỗi server" },
            { status: 500 }
        );
    }
}
