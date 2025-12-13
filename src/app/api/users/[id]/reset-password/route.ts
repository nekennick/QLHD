import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        // Chỉ ADMIN hoặc USER1 mới được reset mật khẩu
        if (
            !session?.user ||
            (session.user.role !== "ADMIN" && session.user.role !== "USER1")
        ) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const userId = params.id;

        // Hash password mặc định '123456'
        const hashedPassword = await bcrypt.hash("123456", 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePassword: true,
            },
        });

        return NextResponse.json(
            { message: "Password reset successful" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
