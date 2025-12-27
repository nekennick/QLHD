import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("123456", 10);

    console.log("Đang tạo tài khoản TCKT...\n");

    // Create USER1_TCKT
    const user1 = await prisma.user.upsert({
        where: { username: "lanhdao_tckt" },
        update: {},
        create: {
            username: "lanhdao_tckt",
            password,
            hoTen: "Lãnh đạo TCKT",
            role: "USER1_TCKT",
            mustChangePassword: true,
        },
    });
    console.log("✅ Đã tạo:", user1.hoTen, "- Username:", user1.username);

    // Create USER2_TCKT
    const user2 = await prisma.user.upsert({
        where: { username: "nhanvien_tckt" },
        update: {},
        create: {
            username: "nhanvien_tckt",
            password,
            hoTen: "Nhân viên TCKT",
            role: "USER2_TCKT",
            mustChangePassword: true,
        },
    });
    console.log("✅ Đã tạo:", user2.hoTen, "- Username:", user2.username);

    console.log("\n🔑 Mật khẩu mặc định: 123456");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
