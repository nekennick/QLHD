import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import WarningList from "@/components/contracts/WarningList";

interface WarningItem {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    hieuLucBaoDam?: Date | null;
    hanBaoHanh?: Date | null;
    giaTriHopDong?: number | null;
    nguoiThucHien?: { hoTen: string } | null;
}

async function getStats(userRole?: string, userId?: string) {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Role-based base filter: USER2 chỉ thấy HĐ được giao cho mình
    const baseWhere = (userRole === "USER2" && userId) ? { nguoiThucHienId: userId } : {};

    const [
        totalContracts,
        // CI stats
        ciTotal,
        ciIncomplete,
        ciDelivering,
        ciApproved,
        ciPaid,
        ciSettled,
        // Detailed warnings
        incompleteList,
        lateDeliveryList,
        expiringGuaranteeList,
        completedList,
    ] = await Promise.all([
        prisma.hopDong.count({ where: baseWhere }),
        // CI Specific
        prisma.hopDong.count({ where: { ...baseWhere, isConstructionInvestment: true } }),
        prisma.hopDong.count({
            where: {
                ...baseWhere,
                isConstructionInvestment: true,
                OR: [{ tenHopDong: null }, { giaTriHopDong: null }, { ngayKy: null }],
            },
        }),
        prisma.hopDong.count({
            where: { ...baseWhere, isConstructionInvestment: true, giaTriGiaoNhan: { not: null }, ngayDuyetThanhToan: null },
        }),
        prisma.hopDong.count({
            where: { ...baseWhere, isConstructionInvestment: true, ngayDuyetThanhToan: { not: null } },
        }),
        prisma.hopDong.count({
            where: { ...baseWhere, isConstructionInvestment: true, giaTriThanhToan: { not: null } },
        }),
        prisma.hopDong.count({
            where: { ...baseWhere, isConstructionInvestment: true, daQuyetToan: true },
        }),
        // Warning lists - with executor and value for table display
        prisma.hopDong.findMany({
            where: {
                ...baseWhere,
                OR: [{ tenHopDong: null }, { giaTriHopDong: null }, { ngayKy: null }],
            },
            select: {
                id: true,
                soHopDong: true,
                tenHopDong: true,
                giaTriHopDong: true,
                nguoiThucHien: { select: { hoTen: true } }
            },
        }),
        prisma.hopDong.findMany({
            where: { ...baseWhere, ngayGiaoHang: { lt: today }, giaTriGiaoNhan: null },
            select: {
                id: true,
                soHopDong: true,
                tenHopDong: true,
                giaTriHopDong: true,
                nguoiThucHien: { select: { hoTen: true } }
            },
        }),
        prisma.hopDong.findMany({
            where: {
                ...baseWhere,
                hieuLucBaoDam: { gte: today, lte: sevenDaysLater },
            },
            select: {
                id: true,
                soHopDong: true,
                tenHopDong: true,
                hieuLucBaoDam: true,
                giaTriHopDong: true,
                nguoiThucHien: { select: { hoTen: true } }
            },
        }),
        prisma.hopDong.findMany({
            where: {
                ...baseWhere,
                hanBaoHanh: { lt: today },
            },
            select: {
                id: true,
                soHopDong: true,
                tenHopDong: true,
                hanBaoHanh: true,
                giaTriHopDong: true,
                nguoiThucHien: { select: { hoTen: true } }
            },
        }),
    ]);

    return {
        totalContracts,
        ciTotal,
        ciIncomplete,
        ciDelivering,
        ciApproved,
        ciPaid,
        ciSettled,
        warnings: {
            incomplete: incompleteList as WarningItem[],
            lateDelivery: lateDeliveryList as WarningItem[],
            expiringGuarantee: expiringGuaranteeList as WarningItem[],
            completed: completedList as WarningItem[],
        }
    };
}

// Serialize dates for client component
function serializeWarningItems(items: WarningItem[]) {
    return items.map(item => ({
        ...item,
        hieuLucBaoDam: item.hieuLucBaoDam?.toISOString() || null,
        hanBaoHanh: item.hanBaoHanh?.toISOString() || null,
    }));
}

export default async function DashboardPage() {
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;
    const stats = await getStats(userRole, userId);

    const warningGroups = [
        {
            title: "Chưa lập hợp đồng",
            items: serializeWarningItems(stats.warnings.incomplete),
            color: "text-yellow-600 dark:text-yellow-400",
            bgColor: "bg-yellow-500/10"
        },
        {
            title: "Hợp đồng giao hàng chậm",
            items: serializeWarningItems(stats.warnings.lateDelivery),
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-500/10"
        },
        {
            title: "Hợp đồng có đảm bảo sắp hết hiệu lực",
            items: serializeWarningItems(stats.warnings.expiringGuarantee),
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-500/10"
        },
        {
            title: "Hợp đồng đã kết thúc",
            items: serializeWarningItems(stats.warnings.completed),
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-500/10"
        },
    ].filter((g) => g.items.length > 0);

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2">
                    Xin chào, <span className="text-slate-900 dark:text-white font-medium">{session?.user?.name}</span>!{" "}
                    <span className="text-slate-500">
                        {session?.user?.role === "USER1" ? "(Lãnh đạo)" : "(Người thực hiện)"}
                    </span>
                </p>
            </div>

            {/* Stats List Section */}
            <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 md:p-8 space-y-4 shadow-sm dark:shadow-none">
                <div className="flex items-baseline gap-2">
                    <span className="text-lg md:text-xl text-slate-700 dark:text-slate-300">Tổng số hợp đồng:</span>
                    <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.totalContracts}</span>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg text-slate-700 dark:text-slate-300">Hợp đồng công trình đầu tư xây dựng:</span>
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.ciTotal}</span>
                    </div>

                    <ul className="ml-8 space-y-2 text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            <span>Chưa lập hợp đồng:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{stats.ciIncomplete}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            <span>Đang giao nhận hàng:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{stats.ciDelivering}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            <span>Đã duyệt thanh toán:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{stats.ciApproved}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            <span>Đã thanh toán:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{stats.ciPaid}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                            <span>Đã quyết toán công trình:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{stats.ciSettled}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Warnings with Delete Support */}
            <WarningList groups={warningGroups} userRole={userRole} />
        </div>
    );
}
