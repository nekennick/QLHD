import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Seed initial users
export async function GET() {
    try {
        // Check if users exist
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            return NextResponse.json({ message: "Users already exist", count: existingUsers });
        }

        // Create default users
        const hashedPassword = await bcrypt.hash("123456", 10);

        const users = await prisma.user.createMany({
            data: [
                {
                    username: "lanhdao",
                    password: hashedPassword,
                    hoTen: "Lãnh Đạo",
                    role: "USER1",
                },
                {
                    username: "nhanvien1",
                    password: hashedPassword,
                    hoTen: "Nhân Viên 1",
                    role: "USER2",
                },
                {
                    username: "nhanvien2",
                    password: hashedPassword,
                    hoTen: "Nhân Viên 2",
                    role: "USER2",
                },
            ],
        });

        return NextResponse.json({
            message: "Seed completed",
            created: users.count,
            credentials: "Tất cả tài khoản có mật khẩu: 123456",
        });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Seed failed" }, { status: 500 });
    }
}
