"use client";

import { useState, useMemo } from "react";
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
    daQuyetToan: boolean;
    nguoiGiao: { hoTen: string } | null;
    nguoiThucHien: { hoTen: string; id: string } | null;
    nguoiThucHienId: string | null;
    nguoiThanhToan: { hoTen: string } | null;
    updatedAt: Date;
}

interface User {
    id: string;
    hoTen: string;
}

interface ContractsTableProps {
    contracts: Contract[];
    canReassign: boolean;
    currentUser?: {
        id: string;
        role: string;
    };
    users?: User[];
}

// Map trạng thái hiển thị sang giá trị filter
const getStatusValue = (contract: Contract): string => {
    if (!contract.tenHopDong) return "chua_lap_hd";
    if (contract.daQuyetToan) return "da_quyet_toan";
    if (contract.hanBaoHanh && new Date(contract.hanBaoHanh) > new Date()) return "bao_hanh";
    if (contract.ngayDuyetThanhToan) return "da_duyet_thanh_toan";
    if (contract.giaTriNghiemThu) return "da_nghiem_thu";
    if (contract.giaTriGiaoNhan) return "dang_giao_nhan";
    return "moi_tao";
};

const statusOptions = [
    { value: "", label: "Tất cả" },
    { value: "chua_lap_hd", label: "Chưa lập HĐ" },
    { value: "dang_giao_nhan", label: "Đang giao nhận" },
    { value: "da_nghiem_thu", label: "Đã nghiệm thu" },
    { value: "da_duyet_thanh_toan", label: "Đã duyệt thanh toán" },
    { value: "da_thanh_toan", label: "Đã thanh toán" },
    { value: "da_quyet_toan", label: "Đã quyết toán" },
    { value: "bao_hanh", label: "Bảo hành" },
    { value: "hoan_tat", label: "Hoàn tất" },
];

export default function ContractsTable({
    contracts,
    canReassign,
    currentUser,
    users = [],
}: ContractsTableProps) {
    const [previewContract, setPreviewContract] = useState<Contract | null>(null);

    // Filter states
    const [searchSoHD, setSearchSoHD] = useState("");
    const [searchTenHD, setSearchTenHD] = useState("");
    const [filterNguoiThucHien, setFilterNguoiThucHien] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("");

    const isStale = (contract: Contract) => {
        if (contract.ngayDuyetThanhToan) return false;

        const lastUpdate = new Date(contract.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 7;
    };

    // Lọc contracts theo các filter
    const filteredContracts = useMemo(() => {
        return contracts.filter((contract) => {
            // Tìm kiếm theo Số HĐ
            if (searchSoHD && !contract.soHopDong.toLowerCase().includes(searchSoHD.toLowerCase())) {
                return false;
            }
            // Tìm kiếm theo Tên HĐ
            if (searchTenHD && !(contract.tenHopDong || "").toLowerCase().includes(searchTenHD.toLowerCase())) {
                return false;
            }
            // Lọc theo người thực hiện
            if (filterNguoiThucHien && contract.nguoiThucHienId !== filterNguoiThucHien) {
                return false;
            }
            // Lọc theo trạng thái
            if (filterTrangThai && getStatusValue(contract) !== filterTrangThai) {
                return false;
            }
            return true;
        });
    }, [contracts, searchSoHD, searchTenHD, filterNguoiThucHien, filterTrangThai]);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-slate-400 text-sm bg-slate-900/50">
                            <th className="px-6 py-3 font-medium">Số HĐ</th>
                            <th className="px-6 py-3 font-medium">Tên hợp đồng</th>
                            <th className="px-6 py-3 font-medium">Giá trị</th>
                            <th className="px-6 py-3 font-medium">Ngày ký</th>
                            <th className="px-6 py-3 font-medium">Người thực hiện</th>
                            <th className="px-6 py-3 font-medium">Trạng thái</th>
                            <th className="px-6 py-3 font-medium"></th>
                        </tr>
                        <tr className="bg-slate-800/50 border-t border-slate-700/30">
                            {/* Filter: Số HĐ */}
                            <th className="px-4 py-2">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchSoHD}
                                    onChange={(e) => setSearchSoHD(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-slate-700/80 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-500"
                                />
                            </th>
                            {/* Filter: Tên HĐ */}
                            <th className="px-4 py-2">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchTenHD}
                                    onChange={(e) => setSearchTenHD(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-slate-700/80 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-500"
                                />
                            </th>
                            {/* Giá trị - không filter */}
                            <th className="px-4 py-2"></th>
                            {/* Ngày ký - không filter */}
                            <th className="px-4 py-2"></th>
                            {/* Filter: Người thực hiện */}
                            <th className="px-4 py-2">
                                <select
                                    value={filterNguoiThucHien}
                                    onChange={(e) => setFilterNguoiThucHien(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-slate-700/80 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Tất cả</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.hoTen}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            {/* Filter: Trạng thái */}
                            <th className="px-4 py-2">
                                <select
                                    value={filterTrangThai}
                                    onChange={(e) => setFilterTrangThai(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-slate-700/80 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            {/* Actions - không filter */}
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        {filteredContracts.map((contract) => {
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
                                                Chưa lập HĐ
                                            </span>
                                        ) : contract.daQuyetToan ? (
                                            <span className="px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded-full border border-slate-500/30">
                                                ✅ Đã quyết toán
                                            </span>
                                        ) : contract.ngayDuyetThanhToan ? (
                                            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                Đã duyệt thanh toán
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
                                            {currentUser?.role === "USER2" ? "Cập nhật →" : "Chi tiết →"}
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
                userRole={currentUser?.role}
            />
        </>
    );
}
