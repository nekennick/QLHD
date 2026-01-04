"use client";

import { useState } from "react";
import Link from "next/link";
import ContractPreviewModal from "./ContractPreviewModal";

interface Contract {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    giaTriHopDong: number | null;
    ngayKy: Date | null;
    ngayHieuLuc: Date | null;
    hieuLucBaoDam: Date | null;
    ngayGiaoHang: Date | null;
    tuChinhHopDong: string | null;
    isConstructionInvestment: boolean;
    giaTriQuyetToan: number | null;
    ngayQuyetToan: Date | null;
    giaTriGiaoNhan: number | null;
    giaTriNghiemThu: number | null;
    ngayDuyetThanhToan: Date | null;
    hanBaoHanh: Date | null;
    daThanhToan: boolean;
    nguoiGiao: { hoTen: string } | null;
    nguoiThucHien: { hoTen: string; id: string } | null;
    nguoiThucHienId: string | null;
    nguoiThanhToan: { hoTen: string } | null;
    updatedAt: Date;
}

interface ContractsTableProps {
    contracts: Contract[];
    canReassign: boolean;
    currentUser?: {
        id: string;
        role: string;
    };
}

export default function ContractsTable({
    contracts,
    canReassign,
    currentUser,
}: ContractsTableProps) {
    const [previewContract, setPreviewContract] = useState<Contract | null>(null);

    const isStale = (contract: Contract) => {
        if (contract.ngayDuyetThanhToan) return false;

        const lastUpdate = new Date(contract.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 7;
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-slate-400 text-sm bg-slate-900/50">
                            <th className="px-6 py-4 font-medium">Số HĐ</th>
                            <th className="px-6 py-4 font-medium">Tên hợp đồng</th>
                            <th className="px-6 py-4 font-medium">Giá trị</th>
                            <th className="px-6 py-4 font-medium">Ngày ký</th>
                            <th className="px-6 py-4 font-medium">Người thực hiện</th>
                            <th className="px-6 py-4 font-medium">Trạng thái</th>
                            <th className="px-6 py-4 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        {contracts.map((contract) => {
                            const stale = isStale(contract);
                            const showWarning = stale && (
                                currentUser?.role === "USER1" ||
                                (currentUser?.role === "USER2" && currentUser?.id === contract.nguoiThucHienId)
                            );

                            return (
                                <tr
                                    key={contract.id}
                                    className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                                >
                                    <td className={`px-6 py-4 font-medium ${showWarning ? "text-red-500 animate-pulse-slow" : "text-white"}`}>
                                        <button
                                            onClick={() => setPreviewContract(contract)}
                                            className="flex items-center gap-2 hover:text-purple-400 transition-colors cursor-pointer text-left"
                                        >
                                            {contract.soHopDong}
                                            {showWarning && (
                                                <span title="Hơn 7 ngày không có cập nhật" className="animate-bounce">
                                                    ⚠️
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className={`px-6 py-4 max-w-[200px] ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        <span
                                            className="line-clamp-2"
                                            title={contract.tenHopDong || undefined}
                                        >
                                            {contract.tenHopDong || "—"}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        {contract.giaTriHopDong
                                            ? new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(contract.giaTriHopDong)
                                            : "—"}
                                    </td>
                                    <td className={`px-6 py-4 ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        {contract.ngayKy
                                            ? new Date(contract.ngayKy).toLocaleDateString("vi-VN")
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={canReassign ? "text-purple-400" : "text-slate-300"}>
                                            {contract.nguoiThucHien?.hoTen || "—"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {!contract.tenHopDong ? (
                                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                                Chưa hoàn thiện
                                            </span>
                                        ) : contract.ngayDuyetThanhToan ? (
                                            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                Đã thanh toán
                                            </span>
                                        ) : contract.giaTriNghiemThu ? (
                                            <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                                                Đã nghiệm thu
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
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/hop-dong/${contract.id}`}
                                            className="text-purple-400 hover:text-purple-300 text-sm"
                                        >
                                            Chi tiết →
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            <ContractPreviewModal
                contract={previewContract}
                isOpen={!!previewContract}
                onClose={() => setPreviewContract(null)}
            />
        </>
    );
}
