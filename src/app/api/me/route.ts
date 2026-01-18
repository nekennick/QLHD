import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { hoTen, newPassword } = body;

        const updateData: {
            hoTen: string;
            password?: string;
            mustChangePassword?: boolean;
        } = {
            hoTen,
        };

        // Nếu có đổi mật khẩu
        if (newPassword) {
            // Lấy thông tin user hiện tại để kiểm tra mật khẩu cũ
            const currentUser = await prisma.user.findUnique({
                where: { id: session.user.id },
            });

            if (currentUser) {
                const isSamePassword = await bcrypt.compare(newPassword, currentUser.password);
                if (isSamePassword) {
                    return NextResponse.json(
                        { message: "Mật khẩu mới không được trùng với mật khẩu hiện tại" },
                        { status: 400 }
                    );
                }
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
            updateData.mustChangePassword = false;
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json(
            { message: "Cập nhật thành công", user: { hoTen: user.hoTen } },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
