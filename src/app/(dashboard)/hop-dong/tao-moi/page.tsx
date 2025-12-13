import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CreateContractForm from "./CreateContractForm";

async function getUsers() {
    return prisma.user.findMany({
        where: { role: "USER2" },
        select: { id: true, hoTen: true },
    });
}

export default async function CreateContractPage() {
    const session = await auth();

    // Chỉ User1 (lãnh đạo) và Admin mới được tạo hợp đồng
    if (session?.user?.role !== "USER1" && session?.user?.role !== "ADMIN") {
        redirect("/hop-dong");
    }

    const users = await getUsers();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Tạo hợp đồng mới</h1>
                <p className="text-slate-400 mt-1">
                    Nhập số hợp đồng và giao cho người thực hiện
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <CreateContractForm users={users} />
            </div>

            {/* Help */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-blue-400 font-medium mb-2">💡 Hướng dẫn</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Số hợp đồng phải là duy nhất trong hệ thống</li>
                    <li>• Người thực hiện sẽ có quyền nhập chi tiết hợp đồng</li>
                    <li>• Bạn có thể cập nhật thông tin sau khi tạo</li>
                </ul>
            </div>
        </div>
    );
}
