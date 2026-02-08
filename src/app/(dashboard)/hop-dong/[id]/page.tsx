import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ContractDetail from "./ContractDetail";

async function getContract(id: string) {
    return prisma.hopDong.findUnique({
        where: { id },
        include: {
            nguoiGiao: { select: { id: true, hoTen: true } },
            nguoiThucHien: { select: { id: true, hoTen: true } },
            nguoiGiaoThanhToan: { select: { id: true, hoTen: true } },
            nguoiThanhToan: { select: { id: true, hoTen: true } },
        },
    });
}

async function getUsers() {
    return prisma.user.findMany({
        where: { role: "USER2" },
        select: { id: true, hoTen: true },
    });
}

async function getTCKTUsers() {
    return prisma.user.findMany({
        where: { role: "USER2_TCKT" },
        select: { id: true, hoTen: true },
    });
}

export default async function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const { id } = await params;
    const [contract, users, tcktUsers] = await Promise.all([
        getContract(id),
        getUsers(),
        getTCKTUsers(),
    ]);

    if (!contract) {
        notFound();
    }

    // Kiểm tra quyền sửa
    // USER1 (Lãnh đạo): CHỈ XEM, không được sửa
    // ADMIN: sửa tất cả
    // USER2: chỉ sửa HĐ được giao cho mình
    // USER2_TCKT: sửa HĐ thanh toán được giao cho mình
    const userRole = session?.user?.role;
    const userId = session?.user?.id;
    const isAssignedExecutor = contract.nguoiThucHienId === userId;
    const isAssignedTCKT = contract.nguoiThanhToanId === userId;

    const canEdit =
        userRole === "ADMIN" ||
        (userRole === "USER2" && isAssignedExecutor) ||
        (userRole === "USER2_TCKT" && isAssignedTCKT);

    // Format contract data for client component
    const contractData = {
        ...contract,
        ngayKy: contract.ngayKy?.toISOString() || null,
        ngayHieuLuc: contract.ngayHieuLuc?.toISOString() || null,
        hieuLucBaoDam: contract.hieuLucBaoDam?.toISOString() || null,
        ngayGiaoHang: contract.ngayGiaoHang?.toISOString() || null,
        ngayDuyetThanhToan: contract.ngayDuyetThanhToan?.toISOString() || null,
        hanBaoHanh: contract.hanBaoHanh?.toISOString() || null,
        ngayQuyetToan: contract.ngayQuyetToan?.toISOString() || null,
        ngayQuyetToanHoanTat: contract.ngayQuyetToanHoanTat?.toISOString() || null,
        nguoiGiaoThanhToan: contract.nguoiGiaoThanhToan,
        nguoiGiaoThanhToanId: contract.nguoiGiaoThanhToanId,
        nguoiThanhToan: contract.nguoiThanhToan,
        nguoiThanhToanId: contract.nguoiThanhToanId,
        giaTriThanhToan: contract.giaTriThanhToan,
        daQuyetToan: contract.daQuyetToan,
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Link href="/hop-dong" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                    Hợp đồng
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white">{contract.soHopDong}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {contract.soHopDong}
                        {!contract.tenHopDong && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800/50">
                                Chưa lập hợp đồng
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {contract.tenHopDong || "Chưa có tên hợp đồng"}
                    </p>
                </div>

                {!canEdit && (
                    <div className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-lg text-sm">
                        🔒 Chỉ xem
                    </div>
                )}
            </div>

            {/* Contract Detail Component */}
            <ContractDetail
                contract={contractData}
                canEdit={canEdit}
                userRole={session?.user?.role}
                userId={session?.user?.id}
                users={users}
                tcktUsers={tcktUsers}
            />
        </div>
    );
}
