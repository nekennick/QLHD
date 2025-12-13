import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Lấy danh sách users
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "USER1") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                hoTen: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}

// POST - Tạo user mới
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "USER1") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo mới có thể tạo người dùng" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, password, hoTen, role } = body;

        if (!username || !password || !hoTen) {
            return NextResponse.json(
                { message: "Vui lòng điền đầy đủ thông tin" },
                { status: 400 }
            );
        }

        // Kiểm tra username đã tồn tại
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json(
                { message: "Tên đăng nhập đã tồn tại" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Nếu là USER1, chỉ được tạo USER2
        let newRole = role;
        if (session.user.role === "USER1") {
            newRole = "USER2";
        }

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                hoTen,
                role: newRole || "USER2",
            },
        });

        return NextResponse.json(
            { id: user.id, username: user.username, hoTen: user.hoTen },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
