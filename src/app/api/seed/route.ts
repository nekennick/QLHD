import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Seed initial admin user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reset = searchParams.get("reset") === "true";

        // Reset: Xóa hết users nếu có tham số reset=true
        if (reset) {
            await prisma.notification.deleteMany({});
            await prisma.pushSubscription.deleteMany({});
            await prisma.hopDong.deleteMany({});
            await prisma.authenticator.deleteMany({});
            await prisma.account.deleteMany({});
            await prisma.user.deleteMany({});
        }

        // Check if users exist
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            return NextResponse.json({ message: "Users already exist", count: existingUsers, hint: "Thêm ?reset=true vào URL để xóa và tạo lại" });
        }

        // Create admin user only
        const hashedPassword = await bcrypt.hash("admin123", 10);

        const admin = await prisma.user.create({
            data: {
                username: "admin",
                password: hashedPassword,
                hoTen: "Administrator",
                role: "ADMIN",
            },
        });

        return NextResponse.json({
            message: "Seed completed",
            admin: { username: admin.username, role: admin.role },
            credentials: "Tài khoản: admin / Mật khẩu: admin123",
        });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Seed failed" }, { status: 500 });
    }
}
