import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Đang cập nhật email = username cho tất cả users...\n");

    const users = await prisma.user.findMany();

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: { email: user.username }  // Dùng username làm email
        });
        console.log("✅ Updated:", user.username);
    }

    console.log("\n🎉 Done! Giờ email = username cho tất cả users.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
