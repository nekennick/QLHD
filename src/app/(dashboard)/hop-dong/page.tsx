import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import ContractsTable from "@/components/contracts/ContractsTable";

async function getContracts(searchParams: { status?: string; nguoiThucHien?: string }, userRole?: string, userId?: string) {
    const where: Record<string, unknown> = {};

    // Role-based filtering: USER2 chỉ thấy HĐ được giao cho mình
    if (userRole === "USER2" && userId) {
        where.nguoiThucHienId = userId;
    }

    if (searchParams.status === "incomplete") {
        where.OR = [{ tenHopDong: null }, { giaTriHopDong: null }, { ngayKy: null }];
    } else if (searchParams.status === "delivering") {
        where.giaTriGiaoNhan = { not: null };
        where.ngayDuyetThanhToan = null;
    } else if (searchParams.status === "paid") {
        where.ngayDuyetThanhToan = { not: null };
    }

    if (searchParams.nguoiThucHien) {
        where.nguoiThucHienId = searchParams.nguoiThucHien;
    }

    return prisma.hopDong.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            soHopDong: true,
            tenHopDong: true,
            giaTriHopDong: true,
            ngayKy: true,
            ngayHieuLuc: true,
            hieuLucBaoDam: true,
            ngayGiaoHang: true,
            tuChinhHopDong: true,
            isConstructionInvestment: true,
            giaTriQuyetToan: true,
            ngayQuyetToan: true,
            giaTriGiaoNhan: true,
            giaTriNghiemThu: true,
            ngayDuyetThanhToan: true,
            hanBaoHanh: true,
            daQuyetToan: true,
            nguoiThucHienId: true,
            updatedAt: true,
            nguoiGiao: { select: { hoTen: true } },
            nguoiThucHien: { select: { hoTen: true, id: true } },
            nguoiThanhToan: { select: { hoTen: true } },
        },
    });
}

async function getUsers() {
    return prisma.user.findMany({
        where: { role: "USER2" },
        select: { id: true, hoTen: true },
    });
}
export default async function HopDongPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; nguoiThucHien?: string }>;
}) {
    const session = await auth();
    const params = await searchParams;
    const userRole = session?.user?.role;
    const userId = session?.user?.id;
    const contracts = await getContracts(params, userRole, userId);
    const users = await getUsers();
    const isAdmin = userRole === "USER1" || userRole === "ADMIN";
    const canReassign = userRole === "USER1" || userRole === "ADMIN";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hợp đồng</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Quản lý danh sách hợp đồng</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/hop-dong/tao-moi"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 text-white rounded-lg hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 transition-all shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo hợp đồng mới
                    </Link>
                )}
            </div>



            {/* Table */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                {contracts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Không có hợp đồng nào</p>
                        {isAdmin && (
                            <Link
                                href="/hop-dong/tao-moi"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 text-white rounded-lg hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 transition-all border border-slate-950 dark:border-transparent"
                            >
                                Tạo hợp đồng đầu tiên
                            </Link>
                        )}
                    </div>
                ) : (
                    <ContractsTable
                        contracts={contracts}
                        canReassign={canReassign}
                        currentUser={{
                            id: session?.user?.id || "",
                            role: session?.user?.role || "",
                        }}
                        users={users}
                    />
                )}
            </div>
        </div>
    );
}
