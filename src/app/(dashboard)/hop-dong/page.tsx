import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import ContractsTable from "@/components/contracts/ContractsTable";

async function getContracts(searchParams: { status?: string; nguoiThucHien?: string }) {
    const where: Record<string, unknown> = {};

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
            daThanhToan: true,
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

interface User {
    id: string;
    hoTen: string;
}

export default async function HopDongPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; nguoiThucHien?: string }>;
}) {
    const session = await auth();
    const params = await searchParams;
    const contracts = await getContracts(params);
    const users = await getUsers();
    const isAdmin = session?.user?.role === "USER1";
    const canReassign = session?.user?.role === "USER1";

    const statusFilters = [
        { value: "", label: "Tất cả" },
        { value: "incomplete", label: "Chưa lập HĐ" },
        { value: "delivering", label: "Đang giao nhận" },
        { value: "paid", label: "Đã thanh toán" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Hợp đồng</h1>
                    <p className="text-slate-400 mt-1">Quản lý danh sách hợp đồng</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/hop-dong/tao-moi"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo HĐ mới
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Trạng thái:</span>
                        <div className="flex gap-1">
                            {statusFilters.map((filter) => (
                                <Link
                                    key={filter.value}
                                    href={`/hop-dong${filter.value ? `?status=${filter.value}` : ""}`}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${params.status === filter.value || (!params.status && !filter.value)
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                        }`}
                                >
                                    {filter.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Người thực hiện:</span>
                        <select
                            defaultValue={params.nguoiThucHien || ""}
                            className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg border-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Tất cả</option>
                            {users.map((user: User) => (
                                <option key={user.id} value={user.id}>
                                    {user.hoTen}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                {contracts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-400 text-lg">Không có hợp đồng nào</p>
                        {isAdmin && (
                            <Link
                                href="/hop-dong/tao-moi"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
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
                    />
                )}
            </div>
        </div>
    );
}
