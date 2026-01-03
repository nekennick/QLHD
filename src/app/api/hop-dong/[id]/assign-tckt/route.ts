import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * POST /api/hop-dong/[id]/assign-tckt
 * Giao việc quyết toán cho nhân viên TCKT
 * Body: { nguoiThanhToanId: string }
 */
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const params = await context.params;
        const contractId = params.id;
        const body = await request.json();
        const { nguoiThanhToanId } = body;

        if (!nguoiThanhToanId) {
            return NextResponse.json(
                { message: "Thiếu thông tin nhân viên TCKT" },
                { status: 400 }
            );
        }

        const currentUserRole = session.user.role;

        // Kiểm tra quyền: chỉ lãnh đạo TCKT hoặc ADMIN mới được giao việc
        if (currentUserRole !== "USER1_TCKT" && currentUserRole !== "ADMIN") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo TCKT mới có quyền giao việc quyết toán" },
                { status: 403 }
            );
        }

        // Lấy thông tin hợp đồng
        const contract = await prisma.hopDong.findUnique({
            where: { id: contractId },
        });

        if (!contract) {
            return NextResponse.json(
                { message: "Không tìm thấy hợp đồng" },
                { status: 404 }
            );
        }

        // Kiểm tra hợp đồng có phải công trình đầu tư xây dựng không
        if (!contract.isConstructionInvestment) {
            return NextResponse.json(
                { message: "Chỉ có thể giao việc quyết toán cho hợp đồng công trình đầu tư xây dựng" },
                { status: 400 }
            );
        }

        // Lấy thông tin nhân viên TCKT được giao
        const tcktUser = await prisma.user.findUnique({
            where: { id: nguoiThanhToanId },
        });

        if (!tcktUser) {
            return NextResponse.json(
                { message: "Không tìm thấy nhân viên TCKT" },
                { status: 404 }
            );
        }

        // Kiểm tra đúng role TCKT
        if (tcktUser.role !== "USER2_TCKT") {
            return NextResponse.json(
                { message: "Chỉ có thể giao việc cho nhân viên TCKT" },
                { status: 403 }
            );
        }

        // Cập nhật người thanh toán
        const oldTCKTId = contract.nguoiThanhToanId;
        const updatedContract = await prisma.hopDong.update({
            where: { id: contractId },
            data: {
                nguoiThanhToanId: nguoiThanhToanId,
            },
            include: {
                nguoiThanhToan: {
                    select: {
                        id: true,
                        hoTen: true,
                    },
                },
            },
        });

        // Tạo thông báo cho nhân viên TCKT được giao
        await createNotification({
            userId: nguoiThanhToanId,
            title: "Giao việc quyết toán công trình",
            message: `Bạn được giao quyết toán hợp đồng ${contract.soHopDong}`,
            type: "payment_assigned",
            link: `/hop-dong/${contractId}`,
        });

        // Tạo thông báo cho người TCKT cũ (nếu có và khác người mới)
        if (oldTCKTId && oldTCKTId !== nguoiThanhToanId) {
            await createNotification({
                userId: oldTCKTId,
                title: "Chuyển giao việc quyết toán",
                message: `Bạn đã được giải phóng khỏi việc quyết toán hợp đồng ${contract.soHopDong}`,
                type: "contract_released",
                link: `/hop-dong`,
            });
        }

        return NextResponse.json({
            message: "Giao việc quyết toán thành công",
            contract: updatedContract,
        });
    } catch (error) {
        console.error("Error assigning TCKT:", error);
        return NextResponse.json(
            { message: "Lỗi server" },
            { status: 500 }
        );
    }
}
