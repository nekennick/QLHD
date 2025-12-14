import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import ReportFilters from "./ReportFilters";

type ReportType = "all" | "incomplete" | "delivering" | "late" | "expiring" | "accepted" | "paid" | "completed";

async function getReportData(type: ReportType, nguoiThucHienId?: string) {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const where: Record<string, unknown> = {};

    // Filter theo người thực hiện
    if (nguoiThucHienId) {
        where.nguoiThucHienId = nguoiThucHienId;
    }

    // Filter theo loại báo cáo
    switch (type) {
        case "incomplete":
            where.OR = [{ tenHopDong: null }, { giaTriHopDong: null }, { ngayKy: null }];
            break;
        case "delivering":
            where.giaTriGiaoNhan = { not: null };
            where.ngayDuyetThanhToan = null;
            break;
        case "late":
            where.ngayGiaoHang = { lt: today };
            where.giaTriGiaoNhan = null;
            break;
        case "expiring":
            where.hieuLucBaoDam = { gte: today, lte: sevenDaysLater };
            break;
        case "accepted":
            where.giaTriNghiemThu = { not: null };
            where.ngayDuyetThanhToan = null;
            break;
        case "paid":
            where.ngayDuyetThanhToan = { not: null };
            break;
        case "completed":
            where.hanBaoHanh = { lt: today };
            break;
    }

    return prisma.hopDong.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            nguoiGiao: { select: { hoTen: true } },
            nguoiThucHien: { select: { hoTen: true } },
        },
    });
}

async function getUsers() {
    return prisma.user.findMany({
        where: { role: "USER2" },
        select: { id: true, hoTen: true },
    });
}

async function getStats() {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [total, incomplete, delivering, late, expiring, accepted, paid, completed] = await Promise.all([
        prisma.hopDong.count(),
        prisma.hopDong.count({ where: { OR: [{ tenHopDong: null }, { giaTriHopDong: null }] } }),
        prisma.hopDong.count({ where: { giaTriGiaoNhan: { not: null }, ngayDuyetThanhToan: null } }),
        prisma.hopDong.count({ where: { ngayGiaoHang: { lt: today }, giaTriGiaoNhan: null } }),
        prisma.hopDong.count({ where: { hieuLucBaoDam: { gte: today, lte: sevenDaysLater } } }),
        prisma.hopDong.count({ where: { giaTriNghiemThu: { not: null }, ngayDuyetThanhToan: null } }),
        prisma.hopDong.count({ where: { ngayDuyetThanhToan: { not: null } } }),
        prisma.hopDong.count({ where: { hanBaoHanh: { lt: today } } }),
    ]);

    return { total, incomplete, delivering, late, expiring, accepted, paid, completed };
}

export default async function ReportPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; nguoiThucHien?: string }>;
}) {
    await auth();
    const params = await searchParams;
    const reportType = (params.type as ReportType) || "all";
    const nguoiThucHienId = params.nguoiThucHien;

    const [contracts, users, stats] = await Promise.all([
        getReportData(reportType, nguoiThucHienId),
        getUsers(),
        getStats(),
    ]);

    const reportTypes: { value: ReportType; label: string; count: number; color: string }[] = [
        { value: "all", label: "Tổng số lượng hợp đồng", count: stats.total, color: "bg-slate-600" },
        { value: "incomplete", label: "Chưa hoàn thiện", count: stats.incomplete, color: "bg-yellow-600" },
        { value: "delivering", label: "Đang giao nhận", count: stats.delivering, color: "bg-blue-600" },
        { value: "late", label: "Giao chậm", count: stats.late, color: "bg-red-600" },
        { value: "expiring", label: "Đảm bảo sắp hết", count: stats.expiring, color: "bg-orange-600" },
        { value: "accepted", label: "Đã nghiệm thu", count: stats.accepted, color: "bg-emerald-600" },
        { value: "paid", label: "Đã thanh toán", count: stats.paid, color: "bg-green-600" },
        { value: "completed", label: "Đã kết thúc", count: stats.completed, color: "bg-slate-500" },
    ];

    const buildUrl = (type?: string, user?: string) => {
        const urlParams = new URLSearchParams();
        if (type) urlParams.set("type", type);
        if (user) urlParams.set("nguoiThucHien", user);
        const queryString = urlParams.toString();
        return `/bao-cao${queryString ? `?${queryString}` : ""}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Báo cáo</h1>
                <p className="text-slate-400 mt-1">Truy xuất báo cáo theo trạng thái và người thực hiện</p>
            </div>

            {/* Report Type Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reportTypes.map((type) => (
                    <Link
                        key={type.value}
                        href={buildUrl(type.value, nguoiThucHienId)}
                        className={`p-4 rounded-xl border transition-all ${reportType === type.value
                            ? "bg-purple-600/20 border-purple-500"
                            : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`w-3 h-3 rounded-full ${type.color}`}></span>
                            <span className="text-2xl font-bold text-white">{type.count}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">{type.label}</p>
                    </Link>
                ))}
            </div>

            {/* Filter by User - Client Component */}
            <ReportFilters
                users={users}
                currentUserId={nguoiThucHienId}
                reportType={reportType}
            />

            {/* Result Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">
                        {reportTypes.find((t) => t.value === reportType)?.label} ({contracts.length} hợp đồng)
                    </h3>
                </div>

                {contracts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-400">Không có hợp đồng nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm bg-slate-900/50">
                                    <th className="px-6 py-4 font-medium">Số HĐ</th>
                                    <th className="px-6 py-4 font-medium">Tên hợp đồng</th>
                                    <th className="px-6 py-4 font-medium">Giá trị</th>
                                    <th className="px-6 py-4 font-medium">Ngày ký</th>
                                    <th className="px-6 py-4 font-medium">Người thực hiện</th>
                                    <th className="px-6 py-4 font-medium">Giao nhận</th>
                                    <th className="px-6 py-4 font-medium">Nghiệm thu</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {contracts.map((contract) => (
                                    <tr
                                        key={contract.id}
                                        className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <Link href={`/hop-dong/${contract.id}`} className="text-purple-400 hover:text-purple-300">
                                                {contract.soHopDong}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{contract.tenHopDong || "—"}</td>
                                        <td className="px-6 py-4">
                                            {contract.giaTriHopDong
                                                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(contract.giaTriHopDong)
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {contract.ngayKy ? new Date(contract.ngayKy).toLocaleDateString("vi-VN") : "—"}
                                        </td>
                                        <td className="px-6 py-4">{contract.nguoiThucHien?.hoTen || "—"}</td>
                                        <td className="px-6 py-4">
                                            {contract.giaTriGiaoNhan
                                                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(contract.giaTriGiaoNhan)
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {contract.giaTriNghiemThu
                                                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(contract.giaTriNghiemThu)
                                                : "—"}
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
