import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

async function getStats() {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [
        totalContracts,
        incompleteContracts,
        deliveringContracts,
        lateDeliveryContracts,
        paidContracts,
        completedContracts,
        expiringGuarantee,
    ] = await Promise.all([
        // Tổng số HĐ
        prisma.hopDong.count(),
        // Chưa hoàn thiện nhập liệu
        prisma.hopDong.count({
            where: {
                OR: [
                    { tenHopDong: null },
                    { giaTriHopDong: null },
                    { ngayKy: null },
                ],
            },
        }),
        // Đang giao nhận (có giá trị giao nhận nhưng chưa bằng giá trị HĐ)
        prisma.hopDong.count({
            where: {
                giaTriGiaoNhan: { not: null },
                ngayDuyetThanhToan: null,
            },
        }),
        // Giao chậm
        prisma.hopDong.count({
            where: {
                ngayGiaoHang: { lt: today },
                giaTriGiaoNhan: null,
            },
        }),
        // Đã duyệt thanh toán
        prisma.hopDong.count({
            where: { ngayDuyetThanhToan: { not: null } },
        }),
        // Đã kết thúc (hết bảo hành)
        prisma.hopDong.count({
            where: {
                hanBaoHanh: { lt: today },
            },
        }),
        // Đảm bảo sắp hết hiệu lực (trong 7 ngày)
        prisma.hopDong.count({
            where: {
                hieuLucBaoDam: {
                    gte: today,
                    lte: sevenDaysLater,
                },
            },
        }),
    ]);

    return {
        totalContracts,
        incompleteContracts,
        deliveringContracts,
        lateDeliveryContracts,
        paidContracts,
        completedContracts,
        expiringGuarantee,
    };
}

async function getRecentContracts() {
    return prisma.hopDong.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
            nguoiThucHien: { select: { hoTen: true } },
        },
    });
}

export default async function DashboardPage() {
    const session = await auth();
    const stats = await getStats();
    const recentContracts = await getRecentContracts();

    const statCards = [
        {
            title: "Tổng hợp đồng",
            value: stats.totalContracts,
            icon: "📋",
            color: "from-blue-500 to-cyan-500",
        },
        {
            title: "Đang giao nhận",
            value: stats.deliveringContracts,
            icon: "🚚",
            color: "from-amber-500 to-orange-500",
        },
        {
            title: "Đã thanh toán",
            value: stats.paidContracts,
            icon: "✅",
            color: "from-green-500 to-emerald-500",
        },
        {
            title: "Đã kết thúc",
            value: stats.completedContracts,
            icon: "🏁",
            color: "from-slate-500 to-slate-600",
        },
    ];

    const warnings = [
        {
            count: stats.incompleteContracts,
            message: "HĐ chưa hoàn thiện nhập liệu",
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
        },
        {
            count: stats.lateDeliveryContracts,
            message: "HĐ giao hàng chậm",
            color: "text-red-400",
            bgColor: "bg-red-500/10",
        },
        {
            count: stats.expiringGuarantee,
            message: "HĐ có đảm bảo sắp hết hiệu lực",
            color: "text-orange-400",
            bgColor: "bg-orange-500/10",
        },
    ].filter((w) => w.count > 0);

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm md:text-base mt-1">
                    Xin chào, {session?.user?.name}!{" "}
                    {session?.user?.role === "USER1" ? "(Lãnh đạo)" : "(Người thực hiện)"}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 md:p-6"
                    >
                        <div
                            className={`absolute top-0 right-0 w-20 md:w-32 h-20 md:h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
                        />
                        <div className="relative">
                            <span className="text-xl md:text-3xl">{stat.icon}</span>
                            <p className="text-2xl md:text-4xl font-bold text-white mt-2 md:mt-3">{stat.value}</p>
                            <p className="text-slate-400 text-xs md:text-sm mt-1">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                        <span className="text-xl md:text-2xl">⚠️</span> Cảnh báo
                    </h2>
                    <div className="space-y-2 md:space-y-3">
                        {warnings.map((warning, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl ${warning.bgColor}`}
                            >
                                <span className={`text-lg md:text-2xl font-bold ${warning.color}`}>
                                    {warning.count}
                                </span>
                                <span className={`text-sm md:text-base ${warning.color}`}>{warning.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Contracts */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-base md:text-lg font-semibold text-white">Hợp đồng gần đây</h2>
                    <Link
                        href="/hop-dong"
                        className="text-xs md:text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Xem tất cả →
                    </Link>
                </div>

                {recentContracts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Chưa có hợp đồng nào</p>
                        <Link
                            href="/hop-dong/tao-moi"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            <span>+</span> Tạo hợp đồng mới
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="pb-3 font-medium">Số HĐ</th>
                                    <th className="pb-3 font-medium">Tên hợp đồng</th>
                                    <th className="pb-3 font-medium">Giá trị</th>
                                    <th className="pb-3 font-medium">Người thực hiện</th>
                                    <th className="pb-3 font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {recentContracts.map((contract) => (
                                    <tr
                                        key={contract.id}
                                        className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                                    >
                                        <td className="py-4">
                                            <Link
                                                href={`/hop-dong/${contract.id}`}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                {contract.soHopDong}
                                            </Link>
                                        </td>
                                        <td className="py-4">{contract.tenHopDong || "—"}</td>
                                        <td className="py-4">
                                            {contract.giaTriHopDong
                                                ? new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                }).format(contract.giaTriHopDong)
                                                : "—"}
                                        </td>
                                        <td className="py-4">
                                            {contract.nguoiThucHien?.hoTen || "—"}
                                        </td>
                                        <td className="py-4">
                                            {!contract.tenHopDong ? (
                                                <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                                    Chưa hoàn thiện
                                                </span>
                                            ) : contract.ngayDuyetThanhToan ? (
                                                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                    Đã thanh toán
                                                </span>
                                            ) : contract.giaTriGiaoNhan ? (
                                                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                                                    Đang giao nhận
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded-full">
                                                    Mới tạo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
