"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

interface Contract {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    giaTriHopDong: number | null;
    ngayKy: string | null;
    ngayHieuLuc: string | null;
    hieuLucBaoDam: string | null;
    ngayGiaoHang: string | null;
    tuChinhHopDong: string | null;
    giaTriGiaoNhan: number | null;
    giaTriNghiemThu: number | null;
    ngayDuyetThanhToan: string | null;
    hanBaoHanh: string | null;
    nguoiGiao: { hoTen: string } | null;
    nguoiThucHien: { id: string; hoTen: string } | null;
    nguoiThucHienId: string | null;
    // Công trình đầu tư xây dựng
    isConstructionInvestment: boolean;
    giaTriQuyetToan: number | null;
    ngayQuyetToan: string | null;
    giaTriVatTuThuaDaXuLy: number | null;
    // TCKT
    nguoiGiaoThanhToan: { id: string; hoTen: string } | null;
    nguoiGiaoThanhToanId: string | null;
    nguoiThanhToan: { id: string; hoTen: string } | null;
    nguoiThanhToanId: string | null;
    giaTriThanhToan: number | null;
    daQuyetToan: boolean;
    ngayQuyetToanHoanTat: string | null;
}

interface User {
    id: string;
    hoTen: string;
}

interface TCKTUser {
    id: string;
    hoTen: string;
}

interface Props {
    contract: Contract;
    canEdit: boolean;
    userRole?: string;
    userId?: string;
    users?: User[];
    tcktUsers?: TCKTUser[];
}

interface ReassignConfirmState {
    show: boolean;
    type: "executor" | "tckt";
    newId: string;
    newName: string;
}

// ========================================
// Section Divider Component
// ========================================
const SectionDivider = ({ title, icon }: { title: string; icon: string }) => (
    <div className="flex items-center gap-4 py-8">
        <div className="flex-1 h-px bg-gradient-to-r from-slate-300 dark:from-slate-700 to-transparent" />
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold px-4 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-lg">
            <span>{icon}</span>
            <span className="uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-slate-300 dark:from-slate-700 to-transparent" />
    </div>
);

export default function ContractDetail({ contract, canEdit, userRole, userId, users = [], tcktUsers = [] }: Props) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [reassignConfirm, setReassignConfirm] = useState<ReassignConfirmState>({
        show: false,
        type: "executor",
        newId: "",
        newName: "",
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Điều kiện cho phép xóa: USER1/ADMIN + chưa có tên + chưa có ngày hiệu lực
    const canDelete = ["USER1", "ADMIN"].includes(userRole || "") && !contract.tenHopDong && !contract.ngayHieuLuc;

    // Hàm xóa hợp đồng
    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/hop-dong/${contract.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/hop-dong");
                router.refresh();
            } else {
                const data = await res.json();
                showToast(data.message || "Có lỗi xảy ra", "error");
            }
        } catch {
            showToast("Có lỗi xảy ra khi xóa hợp đồng", "error");
        }
        setLoading(false);
        setShowDeleteConfirm(false);
    };

    // ========================================
    // Helper Functions
    // ========================================
    const initiateReassign = (type: "executor" | "tckt", selectId: string) => {
        const selectEl = document.getElementById(selectId) as HTMLSelectElement;
        const newId = selectEl?.value;
        if (!newId) {
            const errorText = type === "executor" ? "Vui lòng chọn người thực hiện" : "Vui lòng chọn nhân viên TCKT";
            showToast(errorText, "error");
            return;
        }
        const newName = selectEl?.options[selectEl.selectedIndex]?.text || "";
        setReassignConfirm({ show: true, type, newId, newName });
    };

    const performReassign = async () => {
        const { type, newId } = reassignConfirm;
        try {
            let res: Response;
            if (type === "executor") {
                const url = contract.nguoiThucHienId
                    ? `/api/hop-dong/${contract.id}/reassign`
                    : `/api/hop-dong/${contract.id}`;
                const method = contract.nguoiThucHienId ? "POST" : "PUT";
                res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nguoiThucHienId: newId }),
                });
            } else {
                const url = contract.nguoiThanhToanId
                    ? `/api/hop-dong/${contract.id}/reassign-tckt`
                    : `/api/hop-dong/${contract.id}`;
                const method = contract.nguoiThanhToanId ? "POST" : "PUT";
                res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nguoiThanhToanId: newId }),
                });
            }
            if (res.ok) {
                showToast("Chuyển giao thành công!", "success");
                router.refresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Có lỗi xảy ra", "error");
            }
        } catch {
            showToast("Có lỗi xảy ra khi chuyển giao", "error");
        }
        setReassignConfirm({ show: false, type: "executor", newId: "", newName: "" });
    };
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
    };

    const formatNumberWithSeparator = (value: number | string | null): string => {
        if (value === null || value === "" || value === undefined) return "";
        const num = typeof value === "string" ? parseFloat(value.toString().replace(/\./g, "").replace(",", ".")) : value;
        if (isNaN(num)) return "";
        return new Intl.NumberFormat("vi-VN").format(num);
    };

    const parseFormattedNumber = (value: string): number => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return "—";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canEdit) return;

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data: Record<string, unknown> = {};

        // Process form fields
        for (const [key, value] of formData.entries()) {
            if (key === "updatePayment") continue;
            if (["giaTriHopDong", "giaTriGiaoNhan", "giaTriNghiemThu", "giaTriThanhToan", "giaTriQuyetToan", "giaTriVatTuThuaDaXuLy"].includes(key)) {
                data[key] = parseFormattedNumber(value as string);
            } else if (["ngayKy", "ngayHieuLuc", "ngayGiaoHang", "hieuLucBaoDam", "ngayDuyetThanhToan", "hanBaoHanh", "ngayQuyetToan"].includes(key)) {
                data[key] = value || null;
            } else {
                data[key] = value || null;
            }
        }

        // Validate: Giá trị thanh toán không được vượt giá trị hợp đồng
        const giaTriHD = data.giaTriHopDong as number || contract.giaTriHopDong || 0;
        const giaTriTT = data.giaTriThanhToan as number;
        if (giaTriTT && giaTriHD && giaTriTT > giaTriHD) {
            showToast(`Giá trị thanh toán (${formatCurrency(giaTriTT)}) không được vượt giá trị hợp đồng (${formatCurrency(giaTriHD)})`, "error");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/hop-dong/${contract.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                showToast("Cập nhật thành công!", "success");
                router.refresh();
            } else {
                const responseData = await res.json();
                showToast(responseData.error || "Có lỗi xảy ra", "error");
            }
        } catch {
            showToast("Có lỗi xảy ra khi cập nhật", "error");
        }
        setLoading(false);
    };

    // ========================================
    // Render Helper Functions
    // ========================================
    const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const renderInputField = (
        label: string,
        name: string,
        type: "text" | "number" | "date" | "textarea",
        value: string | number | null,
        placeholder?: string
    ) => {
        const isEditable = canEdit && (
            userRole === "ADMIN" ||
            userRole === "USER1" ||
            (userRole === "USER2" && contract.nguoiThucHienId === userId)
        );
        const displayValue = type === "date" ? formatDate(value as string | null) : (value ?? "");

        return (
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    {label}
                    {!isEditable && <span className="text-xs text-slate-500 dark:text-slate-500 ml-2">* Chỉ quản lý mới có thể chỉnh sửa thông tin này</span>}
                </label>
                {type === "textarea" ? (
                    <textarea
                        name={name}
                        defaultValue={displayValue}
                        disabled={!isEditable}
                        placeholder={placeholder}
                        rows={3}
                        className={inputClass}
                    />
                ) : (
                    <input
                        type={type}
                        name={name}
                        defaultValue={displayValue}
                        disabled={!isEditable}
                        placeholder={placeholder}
                        className={inputClass}
                    />
                )}
            </div>
        );
    };

    const renderReadOnlyField = (label: string, value: string | null | undefined) => (
        <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</label>
            <p className="px-4 py-3 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white">
                {value || "—"}
            </p>
        </div>
    );

    const renderCurrencyField = (
        label: string,
        name: string,
        value: number | null,
        placeholder?: string
    ) => {
        const isEditable = canEdit && (
            userRole === "ADMIN" ||
            userRole === "USER1" ||
            (userRole === "USER2" && contract.nguoiThucHienId === userId)
        );

        const handleCurrencyInput = (e: React.FormEvent<HTMLInputElement>) => {
            const input = e.currentTarget;
            const cursorPos = input.selectionStart || 0;
            const oldLength = input.value.length;
            const rawValue = input.value.replace(/[^\d]/g, "");
            const numValue = parseInt(rawValue) || 0;
            input.value = numValue > 0 ? formatNumberWithSeparator(numValue) : "";
            const newLength = input.value.length;
            const newPos = cursorPos + (newLength - oldLength);
            input.setSelectionRange(newPos, newPos);
        };

        return (
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    {label}
                    {!isEditable && <span className="text-xs text-slate-500 dark:text-slate-500 ml-2">* Chỉ quản lý mới có thể chỉnh sửa thông tin này</span>}
                </label>
                <input
                    type="text"
                    name={name}
                    defaultValue={formatNumberWithSeparator(value)}
                    onInput={handleCurrencyInput}
                    disabled={!isEditable}
                    placeholder={placeholder}
                    className={inputClass + " text-right"}
                />
            </div>
        );
    };

    // ========================================
    // SECTION 1: Thông tin giao nhận
    // ========================================
    const renderSectionPeople = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👤</span> Thông tin giao nhận
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Người giao hợp đồng */}
                {renderReadOnlyField("Người giao hợp đồng", contract.nguoiGiao?.hoTen)}

                {/* Người thực hiện hợp đồng */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Người thực hiện hợp đồng
                    </label>
                    {contract.nguoiThucHien ? (
                        <div className="bg-slate-100 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 space-y-2">
                            <p className="text-slate-900 dark:text-white font-medium">
                                Hiện tại: {contract.nguoiThucHien.hoTen}
                            </p>
                            {userRole === "USER1" && (
                                <div className="flex gap-2">
                                    <select
                                        id="executorSelect"
                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                    >
                                        <option value="">-- Chọn người mới --</option>
                                        {users.filter(u => u.id !== contract.nguoiThucHienId).map((u) => (
                                            <option key={u.id} value={u.id}>{u.hoTen}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => initiateReassign("executor", "executorSelect")}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        Chuyển giao
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : userRole === "USER1" ? (
                        <div className="bg-slate-100 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50">
                            <div className="flex gap-2">
                                <select
                                    id="executorSelect"
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                >
                                    <option value="">-- Chọn người thực hiện --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.hoTen}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => initiateReassign("executor", "executorSelect")}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Giao việc
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-500 italic px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600/50 rounded-lg">
                            Chưa được giao
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    // ========================================
    // SECTION 2: Thông tin hợp đồng
    // ========================================
    const renderSectionContractInfo = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Thông tin hợp đồng
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInputField("Số hợp đồng", "soHopDong", "text", contract.soHopDong)}
                {renderInputField("Ngày ký hợp đồng", "ngayKy", "date", contract.ngayKy)}
            </div>

            {renderInputField("Tên hợp đồng", "tenHopDong", "text", contract.tenHopDong, "Nhập tên hợp đồng")}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderCurrencyField("Giá trị hợp đồng (Đồng)", "giaTriHopDong", contract.giaTriHopDong, "0")}
                {renderInputField("Ngày hiệu lực", "ngayHieuLuc", "date", contract.ngayHieuLuc)}
                {renderInputField("Hiệu lực bảo đảm", "hieuLucBaoDam", "date", contract.hieuLucBaoDam)}
                {renderInputField("Ngày giao hàng", "ngayGiaoHang", "date", contract.ngayGiaoHang)}
            </div>

            {renderInputField("Thông tin tu chỉnh", "tuChinhHopDong", "textarea", contract.tuChinhHopDong, "Nhập thông tin tu chỉnh nếu có")}
        </div>
    );

    // ========================================
    // SECTION 3: Tiến độ thực hiện
    // ========================================
    const renderSectionProgress = () => {
        const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
        const canEditSettlement = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;

        const giaTriQT = contract.giaTriQuyetToan || 0;
        const giaTriTT = contract.giaTriThanhToan || 0;
        const giaTriVTTDaXuLy = contract.giaTriVatTuThuaDaXuLy || 0;
        const vatTuThua = giaTriTT - giaTriQT;
        const vatTuThuaChuaXuLy = giaTriTT - (giaTriQT + giaTriVTTDaXuLy);

        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📊</span> Tiến độ thực hiện
                </h3>

                {/* Giao nhận */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderCurrencyField("Giá trị hàng giao nhận (Đồng)", "giaTriGiaoNhan", contract.giaTriGiaoNhan, "0")}
                    {renderCurrencyField("Giá trị hàng đã nghiệm thu (Đồng)", "giaTriNghiemThu", contract.giaTriNghiemThu, "0")}
                </div>

                {/* Progress bars */}
                {contract.giaTriHopDong && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500 dark:text-slate-400">Tiến độ giao hàng</span>
                                <span className="text-slate-900 dark:text-white">
                                    {Math.min(100, Math.round(((contract.giaTriGiaoNhan || 0) / contract.giaTriHopDong) * 100))}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, ((contract.giaTriGiaoNhan || 0) / contract.giaTriHopDong) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500 dark:text-slate-400">Tiến độ nghiệm thu</span>
                                <span className="text-slate-900 dark:text-white">
                                    {Math.min(100, Math.round(((contract.giaTriNghiemThu || 0) / contract.giaTriHopDong) * 100))}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, ((contract.giaTriNghiemThu || 0) / contract.giaTriHopDong) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Bảo hành & Thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputField("Hạn bảo hành hàng hóa", "hanBaoHanh", "date", contract.hanBaoHanh)}
                    {renderInputField("Ngày duyệt thanh toán", "ngayDuyetThanhToan", "date", contract.ngayDuyetThanhToan)}
                </div>

                {/* Quyết toán ĐTXD - Chỉ hiển thị cho công trình ĐTXD */}
                {contract.isConstructionInvestment && (
                    <>
                        <hr className="border-slate-200 dark:border-slate-700" />
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Giá trị quyết toán công trình ĐTXD (Đồng)
                            </label>
                            <input
                                type="text"
                                name="giaTriQuyetToan"
                                defaultValue={formatNumberWithSeparator(contract.giaTriQuyetToan)}
                                onInput={(e) => {
                                    const input = e.currentTarget;
                                    const cursorPos = input.selectionStart || 0;
                                    const oldLength = input.value.length;
                                    const rawValue = input.value.replace(/[^\d]/g, "");
                                    const numValue = parseInt(rawValue) || 0;
                                    input.value = numValue > 0 ? formatNumberWithSeparator(numValue) : "";
                                    const newLength = input.value.length;
                                    const newPos = cursorPos + (newLength - oldLength);
                                    input.setSelectionRange(newPos, newPos);
                                }}
                                disabled={!canEditSettlement}
                                placeholder="0"
                                className={inputClass + " text-right"}
                            />
                            {!canEditSettlement && contract.nguoiThanhToan && !contract.daQuyetToan && (
                                <p className="text-xs text-orange-400 mt-1">
                                    * Chỉ {contract.nguoiThanhToan.hoTen} (TCKT) mới được phép sửa
                                </p>
                            )}
                        </div>

                        {contract.giaTriQuyetToan !== null && (
                            <div className="p-4 bg-slate-100 dark:bg-purple-900/20 rounded-lg border border-slate-200 dark:border-purple-500/30">
                                <label className="block text-sm font-medium text-slate-600 dark:text-purple-300 mb-1">
                                    Trị giá thừa so với hợp đồng
                                </label>
                                <p className={`text-xl font-bold ${giaTriQT - (contract.giaTriHopDong || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {formatCurrency(giaTriQT - (contract.giaTriHopDong || 0))}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    = Quyết toán - Giá trị hợp đồng
                                </p>
                            </div>
                        )}

                        {/* Vật tư thừa ĐTXD */}
                        {contract.giaTriThanhToan !== null && contract.giaTriQuyetToan !== null && vatTuThua > 0 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-500/30">
                                    <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                                        Tổng trị giá vật tư thừa
                                    </label>
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(vatTuThua)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        = Thanh toán - Quyết toán
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        Trị giá vật tư thừa đã xử lý (Đồng)
                                    </label>
                                    <input
                                        type="text"
                                        name="giaTriVatTuThuaDaXuLy"
                                        defaultValue={formatNumberWithSeparator(contract.giaTriVatTuThuaDaXuLy)}
                                        onInput={(e) => {
                                            const input = e.currentTarget;
                                            const cursorPos = input.selectionStart || 0;
                                            const oldLength = input.value.length;
                                            const rawValue = input.value.replace(/[^\d]/g, "");
                                            const numValue = parseInt(rawValue) || 0;
                                            input.value = numValue > 0 ? formatNumberWithSeparator(numValue) : "";
                                            const newLength = input.value.length;
                                            const newPos = cursorPos + (newLength - oldLength);
                                            input.setSelectionRange(newPos, newPos);
                                        }}
                                        disabled={!canEditSettlement}
                                        placeholder="0"
                                        className={inputClass + " text-right"}
                                    />
                                </div>

                                <div className={`p-4 rounded-lg border ${vatTuThuaChuaXuLy <= 0
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30'
                                    }`}>
                                    <label className={`block text-sm font-medium mb-1 ${vatTuThuaChuaXuLy <= 0
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-red-700 dark:text-red-300'
                                        }`}>
                                        Vật tư thừa chưa xử lý
                                    </label>
                                    <p className={`text-xl font-bold ${vatTuThuaChuaXuLy <= 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {formatCurrency(vatTuThuaChuaXuLy)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        = Thanh toán - (Quyết toán + Đã xử lý)
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Warnings */}
                {contract.hieuLucBaoDam && new Date(contract.hieuLucBaoDam) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg">
                        <p className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                            <span>⚠️</span>
                            Đảm bảo thực hiện hợp đồng sắp hết hiệu lực!
                        </p>
                    </div>
                )}

                {contract.hanBaoHanh && new Date(contract.hanBaoHanh) < new Date() && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/30 rounded-lg">
                        <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span>🏁</span>
                            Đã hết thời hạn bảo hành
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // SECTION 4: Thanh toán (TCKT)
    // ========================================
    const renderSectionTCKT = () => {
        const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
        const canEditPayment = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;
        const paymentInputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-right";

        const giaTriHD = contract.giaTriHopDong || 0;
        const daThanhToan = contract.giaTriThanhToan || 0;
        const conLai = giaTriHD - daThanhToan;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>💰</span> Thanh toán (TCKT)
                    </h3>
                    {contract.daQuyetToan && (
                        <span className="px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-500/30">
                            Đã kết thúc
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Người giao việc thanh toán */}
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                            Người giao việc thanh toán
                        </label>
                        {/* Hiển thị người giao việc thanh toán (USER1_TCKT) */}
                        <p className="px-4 py-3 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white">
                            {contract.nguoiGiaoThanhToan?.hoTen || "—"}
                        </p>
                    </div>

                    {/* Người thực hiện thanh toán */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Người thực hiện thanh toán
                        </label>
                        {contract.nguoiThanhToan ? (
                            <div className="bg-slate-100 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 space-y-2">
                                <p className="text-slate-900 dark:text-white font-medium">
                                    Hiện tại: {contract.nguoiThanhToan.hoTen}
                                </p>
                                {(userRole === "USER1_TCKT" || userRole === "ADMIN") && (
                                    <div className="flex gap-2">
                                        <select
                                            id="tcktSelect"
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                        >
                                            <option value="">-- Chọn người mới --</option>
                                            {tcktUsers.filter(u => u.id !== contract.nguoiThanhToanId).map((u) => (
                                                <option key={u.id} value={u.id}>{u.hoTen}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => initiateReassign("tckt", "tcktSelect")}
                                            className="px-4 py-2 bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-700 text-white text-sm rounded-lg transition-colors border border-slate-950 dark:border-transparent"
                                        >
                                            Chuyển giao
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (userRole === "USER1_TCKT" || userRole === "ADMIN") ? (
                            <div className="bg-slate-100 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50">
                                <div className="flex gap-2">
                                    <select
                                        id="tcktSelect"
                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                    >
                                        <option value="">-- Chọn nhân viên TCKT --</option>
                                        {tcktUsers.map((u) => (
                                            <option key={u.id} value={u.id}>{u.hoTen}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => initiateReassign("tckt", "tcktSelect")}
                                        className="px-4 py-2 bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-700 text-white text-sm rounded-lg transition-colors border border-slate-950 dark:border-transparent"
                                    >
                                        Giao việc
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-500 italic px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600/50 rounded-lg">
                                Chưa được giao
                            </p>
                        )}
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Giá trị thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-100 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Giá trị hợp đồng
                        </label>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(giaTriHD)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Giá trị thanh toán (Đồng)
                        </label>
                        <input
                            type="text"
                            name="giaTriThanhToan"
                            defaultValue={formatNumberWithSeparator(contract.giaTriThanhToan)}
                            onInput={(e) => {
                                const input = e.currentTarget;
                                const cursorPos = input.selectionStart || 0;
                                const oldLength = input.value.length;
                                const rawValue = input.value.replace(/[^\d]/g, "");
                                const numValue = parseInt(rawValue) || 0;
                                input.value = numValue > 0 ? formatNumberWithSeparator(numValue) : "";
                                const newLength = input.value.length;
                                const newPos = cursorPos + (newLength - oldLength);
                                input.setSelectionRange(newPos, newPos);
                            }}
                            disabled={!canEditPayment}
                            placeholder="0"
                            className={paymentInputClass}
                        />
                        {!canEditPayment && contract.nguoiThanhToan && !contract.daQuyetToan && (
                            <p className="text-xs text-orange-400 mt-1">
                                * Chỉ {contract.nguoiThanhToan.hoTen} (TCKT) mới được phép nhập
                            </p>
                        )}
                    </div>

                    <div className="p-4 bg-slate-100 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Còn lại
                        </label>
                        <p className={`text-xl font-bold ${conLai >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(conLai)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            = Giá trị HĐ - Đã thanh toán
                        </p>
                    </div>
                </div>

                {contract.daQuyetToan && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="text-emerald-400 flex items-center gap-2 font-medium">
                            <span>✅</span>
                            Hợp đồng đã kết thúc
                            {contract.ngayQuyetToanHoanTat && (
                                <span className="text-emerald-300 font-normal">
                                    (ngày {new Date(contract.ngayQuyetToanHoanTat).toLocaleDateString("vi-VN")})
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // Sections Array - 4 nhóm mới
    // ========================================
    const sections = [
        { id: "people", render: renderSectionPeople, title: "Thông tin giao nhận", icon: "👥" },
        { id: "contract", render: renderSectionContractInfo, title: "Thông tin hợp đồng", icon: "📋" },
        { id: "progress", render: renderSectionProgress, title: "Tiến độ thực hiện", icon: "📊" },
        { id: "tckt", render: renderSectionTCKT, title: "Thanh toán", icon: "💰" },
    ];

    // ========================================
    // Main Render
    // ========================================
    return (
        <div className="space-y-6">



            {/* Content - Single Page Layout */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
                {sections.map((section, index) => (
                    <div key={section.id}>
                        {/* Divider between sections (skip for first one) */}
                        {index > 0 && section.title && (
                            <SectionDivider title={section.title} icon={section.icon} />
                        )}
                        {section.render()}
                    </div>
                ))}

                {/* Submit button */}
                {canEdit && (
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white font-semibold rounded-lg shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                )}
            </form>

            {/* Nút Xóa HĐ - chỉ hiện cho lãnh đạo khi HĐ chưa có tên và ngày hiệu lực */}
            {canDelete && (
                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        🗑️ Xóa hợp đồng
                    </button>
                </div>
            )}

            {/* Confirmation Dialog for Reassignment */}
            <ConfirmDialog
                isOpen={reassignConfirm.show}
                title={reassignConfirm.type === "executor" ? "Xác nhận chuyển giao" : "Xác nhận chuyển giao TCKT"}
                description={`Bạn có chắc chắn muốn ${contract.nguoiThucHienId || contract.nguoiThanhToanId ? "chuyển giao" : "giao việc"} cho "${reassignConfirm.newName}"?`}
                confirmLabel="Xác nhận"
                cancelLabel="Hủy"
                variant="info"
                onConfirm={performReassign}
                onCancel={() => setReassignConfirm({ show: false, type: "executor", newId: "", newName: "" })}
            />

            {/* Confirmation Dialog for Delete */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Xác nhận xóa hợp đồng"
                description={`Bạn có chắc chắn muốn xóa hợp đồng "${contract.soHopDong}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                cancelLabel="Hủy"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
