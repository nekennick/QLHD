import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Chỉ ADMIN mới được xóa người dùng
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Chỉ quản trị viên mới có thể xóa người dùng" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Không cho phép tự xóa chính mình
        if (id === session.user.id) {
            return NextResponse.json(
                { message: "Không thể tự xóa tài khoản của chính mình" },
                { status: 400 }
            );
        }

        // Kiểm tra user có tồn tại không
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Người dùng không tồn tại" },
                { status: 404 }
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
