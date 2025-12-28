import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating users with email field...\n");

    const users = await prisma.user.findMany();

    for (const user of users) {
        if (!user.email) {
            await prisma.user.update({
                where: { id: user.id },
                data: { email: `${user.username}@local` }
            });
            console.log("✅ Updated:", user.username);
        }
    }

    console.log("\n🎉 Done!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
