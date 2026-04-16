"use client";

import Link from "next/link";

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
    nguoiThucHien: { hoTen: string } | null;
    nguoiThanhToan: { hoTen: string } | null;
}

interface ContractPreviewModalProps {
    contract: Contract | null;
    isOpen: boolean;
    onClose: () => void;
    userRole?: string;
}

const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN");
};

export default function ContractPreviewModal({
    contract,
    isOpen,
    onClose,
    userRole,
}: ContractPreviewModalProps) {
    if (!isOpen || !contract) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Hợp đồng {contract.soHopDong}
                        </h2>
                        {contract.tenHopDong && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {contract.tenHopDong}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* Thông tin cơ bản */}
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Ngày ký" value={formatDate(contract.ngayKy)} />
                        <InfoItem label="Ngày hiệu lực" value={formatDate(contract.ngayHieuLuc)} />
                        <InfoItem label="Trị giá hợp đồng" value={formatCurrency(contract.giaTriHopDong)} highlight />
                        <InfoItem label="Hiệu lực bảo đảm" value={formatDate(contract.hieuLucBaoDam)} />
                        <InfoItem label="Ngày giao hàng" value={formatDate(contract.ngayGiaoHang)} />
                        <InfoItem label="Hạn bảo hành" value={formatDate(contract.hanBaoHanh)} />
                    </div>

                    {/* Ghi chú (nếu có) */}
                    {contract.tuChinhHopDong && (
                        <div className="bg-slate-100 dark:bg-slate-700/30 rounded-lg p-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Ghi chú hợp đồng</p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm">{contract.tuChinhHopDong}</p>
                        </div>
                    )}

                    {/* Người thực hiện */}
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Người giao" value={contract.nguoiGiao?.hoTen || "—"} />
                        <InfoItem label="Người thực hiện" value={contract.nguoiThucHien?.hoTen || "—"} />
                    </div>

                    {/* Tiến độ */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Tiến độ thực hiện
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem
                                label="Giá trị giao nhận"
                                value={contract.giaTriGiaoNhan ? formatCurrency(contract.giaTriGiaoNhan) : "Chưa giao nhận"}
                                status={contract.giaTriGiaoNhan ? "success" : "pending"}
                            />
                            <InfoItem
                                label="Giá trị nghiệm thu"
                                value={contract.giaTriNghiemThu ? formatCurrency(contract.giaTriNghiemThu) : "Chưa nghiệm thu"}
                                status={contract.giaTriNghiemThu ? "success" : "pending"}
                            />
                            <InfoItem
                                label="Duyệt thanh toán"
                                value={contract.ngayDuyetThanhToan ? formatDate(contract.ngayDuyetThanhToan) : "Chưa duyệt"}
                                status={contract.ngayDuyetThanhToan ? "success" : "pending"}
                            />
                            <InfoItem
                                label="Quyết toán hợp đồng"
                                value={contract.daQuyetToan ? "Đã kết thúc" : "Chưa quyết toán"}
                                status={contract.daQuyetToan ? "success" : "pending"}
                            />
                        </div>
                    </div>

                    {/* Quyết toán công trình (chỉ hiện với HĐ đầu tư xây dựng) */}
                    {contract.isConstructionInvestment && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span>🏗️</span> Quyết toán công trình
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem
                                    label="Giá trị quyết toán"
                                    value={contract.giaTriQuyetToan ? formatCurrency(contract.giaTriQuyetToan) : "Chưa quyết toán"}
                                    status={contract.giaTriQuyetToan ? "success" : "pending"}
                                    highlight={!!contract.giaTriQuyetToan}
                                />
                                <InfoItem
                                    label="Ngày quyết toán"
                                    value={contract.ngayQuyetToan ? formatDate(contract.ngayQuyetToan) : "—"}
                                />
                                <InfoItem
                                    label="Người thanh toán (TCKT)"
                                    value={contract.nguoiThanhToan?.hoTen || "Chưa phân công"}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Đóng
                    </button>
                    <Link
                        href={`/hop-dong/${contract.id}`}
                        className="px-4 py-2 text-sm text-white bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 rounded-lg transition-all shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent"
                    >
                        {userRole === "USER2" ? "Cập nhật →" : "Xem chi tiết →"}
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Helper Component
function InfoItem({
    label,
    value,
    highlight,
    status,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    status?: "success" | "pending";
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider">{label}</span>
            <span
                className={`text-sm font-medium ${highlight
                    ? "text-purple-600 dark:text-purple-400"
                    : status === "success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : status === "pending"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-700 dark:text-slate-300"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}
