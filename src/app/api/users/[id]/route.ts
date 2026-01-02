import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const role = session.user.role;

        // Quyền xóa: ADMIN hoặc USER1 (chỉ được xóa USER2)
        if (role !== "ADMIN" && role !== "USER1") {
            return NextResponse.json(
                { message: "Bạn không có quyền xóa người dùng" },
                { status: 403 }
            );
        }

        // Không cho phép tự xóa chính mình
        if (id === session.user.id) {
            return NextResponse.json(
                { message: "Không thể tự xóa tài khoản của chính mình" },
                { status: 400 }
            );
        }

        // Kiểm tra user có tồn tại không và lấy thông tin role + hợp đồng
        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        hopDongThucHien: true,
                        hopDongThanhToan: true,
                        hopDongGiao: true,
                    }
                }
            }
        });

        if (!targetUser) {
            return NextResponse.json(
                { message: "Người dùng không tồn tại" },
                { status: 404 }
            );
        }

        // USER1 chỉ được xóa USER2
        if (role === "USER1" && targetUser.role !== "USER2") {
            return NextResponse.json(
                { message: "Lãnh đạo chỉ có quyền xóa tài khoản Người thực hiện (USER2)" },
                { status: 403 }
            );
        }

        // Kiểm tra điều kiện không có hợp đồng nào
        const totalContracts = targetUser._count.hopDongThucHien + targetUser._count.hopDongThanhToan;

        if (totalContracts > 0) {
            return NextResponse.json(
                { message: `Không thể xóa vì người dùng đang thực hiện ${totalContracts} hợp đồng. Vui lòng điều chuyển hợp đồng trước khi xóa.` },
                { status: 400 }
            );
        }

        // Nếu targetUser là USER1 và ADMIN đang xóa, hoặc trường hợp đặc biệt khác
        if (targetUser._count.hopDongGiao > 0 && role === "ADMIN") {
            return NextResponse.json(
                { message: "Người dùng này đã từng giao hợp đồng, không nên xóa để giữ lịch sử dữ liệu." },
                { status: 400 }
            );
        }

        // Xóa user
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Đã xóa người dùng thành công" });
    } catch (error) {
        console.error("Error deleting user:", error);
        // Kiểm tra lỗi ràng buộc khóa ngoại (nếu user đang có hợp đồng)
        // Prisma error code P2003: Foreign key constraint failed
        if ((error as any).code === 'P2003') {
            return NextResponse.json(
                { message: "Không thể xóa người dùng này vì đàng có dữ liệu liên quan (Hợp đồng, Báo cáo...)" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Lỗi server khi xóa người dùng" },
            { status: 500 }
        );
    }
}
