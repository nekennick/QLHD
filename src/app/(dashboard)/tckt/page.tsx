import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import TCKTDashboard from "./TCKTDashboard";

async function getPendingPayments() {
    return prisma.hopDong.findMany({
        where: {
            ngayDuyetThanhToan: { not: null },
            daQuyetToan: false,
        },
        include: {
            nguoiGiao: { select: { id: true, hoTen: true } },
            nguoiThucHien: { select: { id: true, hoTen: true } },
            nguoiThanhToan: { select: { id: true, hoTen: true } },
        },
        orderBy: { ngayDuyetThanhToan: "asc" },
    });
}

async function getTCKTStaff() {
    return prisma.user.findMany({
        where: { role: "USER2_TCKT" },
        select: { id: true, hoTen: true },
    });
}

export default async function TCKTPage() {
    const session = await auth();

    // Chỉ TCKT và ADMIN được xem
    if (
        !session?.user ||
        !["USER1_TCKT", "USER2_TCKT", "ADMIN"].includes(session.user.role)
    ) {
        redirect("/");
    }

    const [contracts, staff] = await Promise.all([
        getPendingPayments(),
        getTCKTStaff(),
    ]);

    // Format dates for client component
    const formattedContracts = contracts.map((c) => ({
        ...c,
        ngayDuyetThanhToan: c.ngayDuyetThanhToan?.toISOString() || null,
        ngayKy: c.ngayKy?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Thanh toán</h1>
                <p className="text-slate-400 mt-1">
                    Danh sách hợp đồng chờ thanh toán
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-white">{contracts.length}</p>
                    <p className="text-sm text-slate-400">Chờ thanh toán</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-white">
                        {contracts.filter((c) => c.nguoiThanhToanId).length}
                    </p>
                    <p className="text-sm text-slate-400">Đã giao việc</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-white">
                        {contracts.filter((c) => !c.nguoiThanhToanId).length}
                    </p>
                    <p className="text-sm text-slate-400">Chưa giao việc</p>
                </div>
            </div>

            {/* Client Component for interactive table */}
            <TCKTDashboard
                contracts={formattedContracts}
                staff={staff}
                userRole={session.user.role}
                userId={session.user.id}
            />
        </div>
    );
}
