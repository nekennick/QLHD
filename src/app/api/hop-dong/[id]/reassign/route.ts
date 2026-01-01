import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * POST /api/hop-dong/[id]/reassign
 * Chuyển giao hợp đồng cho người thực hiện mới
 * Body: { newExecutorId: string }
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
        const { newExecutorId } = body;

        if (!newExecutorId) {
            return NextResponse.json(
                { message: "Thiếu thông tin người thực hiện mới" },
                { status: 400 }
            );
        }

        const currentUserRole = session.user.role;

        // Kiểm tra quyền: chỉ lãnh đạo mới được chuyển giao
        if (currentUserRole !== "USER1" && currentUserRole !== "USER1_TCKT") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo mới có quyền chuyển giao hợp đồng" },
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

        // Lấy thông tin người thực hiện mới
        const newExecutor = await prisma.user.findUnique({
            where: { id: newExecutorId },
        });

        if (!newExecutor) {
            return NextResponse.json(
                { message: "Không tìm thấy người thực hiện mới" },
                { status: 404 }
            );
        }

        // Kiểm tra quyền chuyển giao dựa trên role
        if (currentUserRole === "USER1") {
            // Lãnh đạo hợp đồng chỉ chuyển giao cho USER2
            if (newExecutor.role !== "USER2") {
                return NextResponse.json(
                    { message: "Lãnh đạo hợp đồng chỉ có thể chuyển giao cho nhân viên hợp đồng" },
                    { status: 403 }
                );
            }
        } else if (currentUserRole === "USER1_TCKT") {
            // Lãnh đạo TCKT chỉ chuyển giao cho USER2_TCKT
            if (newExecutor.role !== "USER2_TCKT") {
                return NextResponse.json(
                    { message: "Lãnh đạo TCKT chỉ có thể chuyển giao cho nhân viên TCKT" },
                    { status: 403 }
                );
            }

            // Và chỉ chuyển giao hợp đồng đã có ngayDuyetThanhToan
            if (!contract.ngayDuyetThanhToan) {
                return NextResponse.json(
                    { message: "Chỉ có thể chuyển giao hợp đồng đã đến giai đoạn thanh toán" },
                    { status: 400 }
                );
            }
        }

        // Cập nhật người thực hiện
        const updatedContract = await prisma.hopDong.update({
            where: { id: contractId },
            data: {
                nguoiThucHienId: newExecutorId,
            },
            include: {
                nguoiThucHien: {
                    select: {
                        id: true,
                        hoTen: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: "Chuyển giao hợp đồng thành công",
            contract: updatedContract,
        });
    } catch (error) {
        console.error("Error reassigning contract:", error);
        return NextResponse.json(
            { message: "Lỗi server" },
            { status: 500 }
        );
    }
}
