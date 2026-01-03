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
    // User1 được sửa tất cả, User2 chỉ sửa HĐ được giao
    const canEdit =
        session?.user?.role === "USER1" ||
        session?.user?.role === "ADMIN" ||
        contract.nguoiThucHienId === session?.user?.id;

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
        nguoiThanhToan: contract.nguoiThanhToan,
        nguoiThanhToanId: contract.nguoiThanhToanId,
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/hop-dong" className="hover:text-white transition-colors">
                    Hợp đồng
                </Link>
                <span>/</span>
                <span className="text-white">{contract.soHopDong}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        {contract.soHopDong}
                        {!contract.tenHopDong && (
                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                Chưa hoàn thiện
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {contract.tenHopDong || "Chưa có tên hợp đồng"}
                    </p>
                </div>

                {!canEdit && (
                    <div className="px-3 py-1.5 bg-slate-700/50 text-slate-400 rounded-lg text-sm">
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
