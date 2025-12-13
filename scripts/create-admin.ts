import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Thông tin tài khoản admin muốn tạo
    const username = "admin";
    const password = "712880";
    const hoTen = "Quản trị viên Hệ thống";

    console.log(`Đang tạo tài khoản admin: ${username}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                password: hashedPassword,
                role: "ADMIN",
                hoTen: hoTen,
            },
            create: {
                username,
                password: hashedPassword,
                hoTen: hoTen,
                role: "ADMIN",
            },
        });

        console.log("====================================");
        console.log("✅ TẠO ADMIN THÀNH CÔNG!");
        console.log("====================================");
        console.log(`👤 Username: ${user.username}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🛡️ Role    : ${user.role}`);
        console.log("====================================");
    } catch (e) {
        console.error("❌ Lỗi khi tạo admin:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
