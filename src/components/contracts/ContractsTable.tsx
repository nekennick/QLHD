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
    { value: "chua_lap_hd", label: "Chưa lập hợp đồng" },
    { value: "dang_giao_nhan", label: "Đang giao nhận" },
    { value: "da_nghiem_thu", label: "Đã nghiệm thu" },
    { value: "da_duyet_thanh_toan", label: "Đã duyệt thanh toán" },
    { value: "da_thanh_toan", label: "Đã thanh toán" },
    { value: "da_quyet_toan", label: "Đã quyết toán" },
    { value: "bao_hanh", label: "Bảo hành" },
    { value: "hoan_tat", label: "Kết thúc" },
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

    // Sort states
    type SortField = 'giaTriHopDong' | 'ngayKy' | null;
    type SortDirection = 'asc' | 'desc';
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Handle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const isStale = (contract: Contract) => {
        if (contract.ngayDuyetThanhToan) return false;

        const lastUpdate = new Date(contract.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 7;
    };

    // Lọc và sắp xếp contracts
    const filteredContracts = useMemo(() => {
        // Bước 1: Lọc
        let result = contracts.filter((contract) => {
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

        // Bước 2: Sắp xếp
        if (sortField) {
            result = [...result].sort((a, b) => {
                let aValue = 0;
                let bValue = 0;

                if (sortField === 'giaTriHopDong') {
                    aValue = a.giaTriHopDong || 0;
                    bValue = b.giaTriHopDong || 0;
                } else if (sortField === 'ngayKy') {
                    aValue = a.ngayKy ? new Date(a.ngayKy).getTime() : 0;
                    bValue = b.ngayKy ? new Date(b.ngayKy).getTime() : 0;
                }

                if (sortDirection === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }

        return result;
    }, [contracts, searchSoHD, searchTenHD, filterNguoiThucHien, filterTrangThai, sortField, sortDirection]);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left bg-slate-100 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm relative z-10">
                            {/* Số hợp đồng */}
                            <th className="px-4 py-5 min-w-[200px]">
                                <div className="space-y-2.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Số hợp đồng</span>
                                    <input
                                        type="text"
                                        placeholder="🔍 Tìm kiếm..."
                                        value={searchSoHD}
                                        onChange={(e) => setSearchSoHD(e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-normal outline-none"
                                    />
                                </div>
                            </th>
                            {/* Tên hợp đồng */}
                            <th className="px-4 py-5 min-w-[300px]">
                                <div className="space-y-2.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tên hợp đồng</span>
                                    <input
                                        type="text"
                                        placeholder="🔍 Tìm kiếm..."
                                        value={searchTenHD}
                                        onChange={(e) => setSearchTenHD(e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-normal outline-none"
                                    />
                                </div>
                            </th>
                            {/* Giá trị - sortable */}
                            <th
                                className="px-4 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors select-none group min-w-[150px] whitespace-nowrap"
                                onClick={() => handleSort('giaTriHopDong')}
                            >
                                <div className="flex items-center gap-2 mb-10">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Giá trị</span>
                                    <div className="flex flex-col text-[10px] leading-none text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                        <span className={sortField === 'giaTriHopDong' && sortDirection === 'asc' ? 'text-purple-500 dark:text-purple-400' : ''}>▲</span>
                                        <span className={sortField === 'giaTriHopDong' && sortDirection === 'desc' ? 'text-purple-500 dark:text-purple-400' : ''}>▼</span>
                                    </div>
                                </div>
                            </th>
                            {/* Ngày ký - sortable */}
                            <th
                                className="px-4 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors select-none group min-w-[150px] whitespace-nowrap"
                                onClick={() => handleSort('ngayKy')}
                            >
                                <div className="flex items-center gap-2 mb-10">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Ngày ký</span>
                                    <div className="flex flex-col text-[10px] leading-none text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                        <span className={sortField === 'ngayKy' && sortDirection === 'asc' ? 'text-purple-500 dark:text-purple-400' : ''}>▲</span>
                                        <span className={sortField === 'ngayKy' && sortDirection === 'desc' ? 'text-purple-500 dark:text-purple-400' : ''}>▼</span>
                                    </div>
                                </div>
                            </th>
                            {/* Người thực hiện - Chỉ hiển thị cho lãnh đạo */}
                            {["USER1", "ADMIN"].includes(currentUser?.role || "") && (
                                <th className="px-4 py-5 min-w-[180px]">
                                    <div className="space-y-2.5">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Người thực hiện</span>
                                        <select
                                            value={filterNguoiThucHien}
                                            onChange={(e) => setFilterNguoiThucHien(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-normal cursor-pointer outline-none"
                                        >
                                            <option value="">Tất cả</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id} className="bg-white dark:bg-slate-900">
                                                    {user.hoTen}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                            )}
                            {/* Trạng thái */}
                            <th className="px-4 py-5 min-w-[180px]">
                                <div className="space-y-2.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Trạng thái</span>
                                    <select
                                        value={filterTrangThai}
                                        onChange={(e) => setFilterTrangThai(e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-normal cursor-pointer outline-none"
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </th>
                            {/* Actions */}
                            <th className="px-4 py-5 min-w-[120px]"></th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-300">
                        {filteredContracts.map((contract) => {
                            const stale = isStale(contract);
                            const showWarning = stale && (
                                currentUser?.role === "USER1" ||
                                (currentUser?.role === "USER2" && currentUser?.id === contract.nguoiThucHienId)
                            );

                            return (
                                <tr
                                    key={contract.id}
                                    className="border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                                >
                                    <td className={`px-4 py-4 font-medium ${showWarning ? "text-red-500 animate-pulse-slow" : "text-slate-900 dark:text-white"}`}>
                                        <button
                                            onClick={() => setPreviewContract(contract)}
                                            className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer text-left"
                                        >
                                            {contract.soHopDong}
                                            {showWarning && (
                                                <span title="Hơn 7 ngày không có cập nhật" className="animate-bounce">
                                                    ⚠️
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className={`px-4 py-4 max-w-[280px] ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        <span
                                            className="line-clamp-3"
                                            title={contract.tenHopDong || undefined}
                                        >
                                            {contract.tenHopDong || "—"}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-4 whitespace-nowrap ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        {contract.giaTriHopDong
                                            ? new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(contract.giaTriHopDong)
                                            : "—"}
                                    </td>
                                    <td className={`px-4 py-4 whitespace-nowrap ${showWarning ? "text-red-400 animate-pulse-slow" : ""}`}>
                                        {contract.ngayKy
                                            ? new Date(contract.ngayKy).toLocaleDateString("vi-VN")
                                            : "—"}
                                    </td>
                                    {/* Người thực hiện - Chỉ hiển thị cho lãnh đạo */}
                                    {["USER1", "ADMIN"].includes(currentUser?.role || "") && (
                                        <td className="px-4 py-4">
                                            <span className={canReassign ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-300"}>
                                                {contract.nguoiThucHien?.hoTen || "—"}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {!contract.tenHopDong ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800/50">
                                                Chưa lập hợp đồng
                                            </span>
                                        ) : contract.daQuyetToan ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-500/30">
                                                ✅ Đã quyết toán
                                            </span>
                                        ) : contract.ngayDuyetThanhToan ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/50">
                                                Đã duyệt thanh toán
                                            </span>
                                        ) : contract.giaTriNghiemThu ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                                Đã nghiệm thu
                                            </span>
                                        ) : contract.giaTriGiaoNhan ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/50">
                                                Đang giao nhận
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-500/30">
                                                Mới tạo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/hop-dong/${contract.id}`}
                                            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm"
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
