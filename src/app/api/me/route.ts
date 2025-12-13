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
        const { hoTen, password, newPassword } = body;

        // Cơ bản: Cho phép đổi tên hiển thị
        const updateData: {
            hoTen: string;
            password?: string;
        } = {
            hoTen,
        };

        // Nếu có đổi mật khẩu
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
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
