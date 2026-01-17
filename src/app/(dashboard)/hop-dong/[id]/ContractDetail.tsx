"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
    // TCKT
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
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
        <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold px-4 py-2 bg-slate-800/80 rounded-full border border-slate-700/50 shadow-lg">
            <span>{icon}</span>
            <span className="uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-slate-700 to-transparent" />
    </div>
);

export default function ContractDetail({ contract, canEdit, userRole, userId, users = [], tcktUsers = [] }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [reassignConfirm, setReassignConfirm] = useState<ReassignConfirmState>({
        show: false,
        type: "executor",
        newId: "",
        newName: "",
    });

    // ========================================
    // Helper Functions
    // ========================================
    const initiateReassign = (type: "executor" | "tckt", selectId: string) => {
        const selectEl = document.getElementById(selectId) as HTMLSelectElement;
        const newId = selectEl?.value;
        if (!newId) {
            const errorText = type === "executor" ? "Vui lòng chọn người thực hiện" : "Vui lòng chọn nhân viên TCKT";
            setMessage({ type: "error", text: errorText });
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
                setMessage({ type: "success", text: "Chuyển giao thành công!" });
                router.refresh();
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Có lỗi xảy ra" });
            }
        } catch {
            setMessage({ type: "error", text: "Có lỗi xảy ra khi chuyển giao" });
        }
        setReassignConfirm({ show: false, type: "executor", newId: "", newName: "" });
    };

    const isContractComplete = Boolean(
        contract.tenHopDong &&
        contract.giaTriHopDong &&
        contract.ngayKy &&
        contract.ngayHieuLuc &&
        contract.ngayGiaoHang &&
        contract.hieuLucBaoDam
    );

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
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const data: Record<string, unknown> = {};

        // Process form fields
        for (const [key, value] of formData.entries()) {
            if (key === "updatePayment") continue;
            if (["giaTriHopDong", "giaTriGiaoNhan", "giaTriNghiemThu", "giaTriThanhToan", "giaTriQuyetToan"].includes(key)) {
                data[key] = parseFormattedNumber(value as string);
            } else if (["ngayKy", "ngayHieuLuc", "ngayGiaoHang", "hieuLucBaoDam", "ngayDuyetThanhToan", "hanBaoHanh", "ngayQuyetToan"].includes(key)) {
                data[key] = value || null;
            } else {
                data[key] = value || null;
            }
        }

        try {
            const res = await fetch(`/api/hop-dong/${contract.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Cập nhật thành công!" });
                router.refresh();
            } else {
                const responseData = await res.json();
                setMessage({ type: "error", text: responseData.error || "Có lỗi xảy ra" });
            }
        } catch {
            setMessage({ type: "error", text: "Có lỗi xảy ra khi cập nhật" });
        }
        setLoading(false);
    };

    // ========================================
    // Render Helper Functions
    // ========================================
    const inputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {label}
                    {!isEditable && <span className="text-xs text-slate-500 ml-2">* Chỉ quản lý mới có thể chỉnh sửa thông tin này</span>}
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
            <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>
            <p className="px-4 py-3 bg-slate-900/30 border border-slate-600/50 rounded-lg text-white">
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {label}
                    {!isEditable && <span className="text-xs text-slate-500 ml-2">* Chỉ quản lý mới có thể chỉnh sửa thông tin này</span>}
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
    // Section Render Functions
    // Mỗi section là 1 function riêng để dễ sắp xếp
    // ========================================

    const renderSectionInfo = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📋</span> Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInputField("Số hợp đồng", "soHopDong", "text", contract.soHopDong)}
                {renderReadOnlyField("Người giao", contract.nguoiGiao?.hoTen)}

                {/* Người thực hiện */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Người thực hiện
                    </label>
                    {contract.nguoiThucHien ? (
                        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50 space-y-2">
                            <p className="text-white font-medium">
                                Hiện tại: {contract.nguoiThucHien.hoTen}
                            </p>
                            {userRole === "USER1" && (
                                <div className="flex gap-2">
                                    <select
                                        id="executorSelect"
                                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
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
                        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                            <div className="flex gap-2">
                                <select
                                    id="executorSelect"
                                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
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
                        <p className="text-slate-500 italic px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg">
                            Chưa được giao
                        </p>
                    )}
                </div>
            </div>

            <hr className="border-slate-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInputField("Tên hợp đồng", "tenHopDong", "text", contract.tenHopDong, "Nhập tên hợp đồng")}
                {renderCurrencyField("Giá trị hợp đồng (Đồng)", "giaTriHopDong", contract.giaTriHopDong, "0")}
                {renderInputField("Ngày ký", "ngayKy", "date", contract.ngayKy)}
                {renderInputField("Ngày hiệu lực", "ngayHieuLuc", "date", contract.ngayHieuLuc)}
                {renderInputField("Ngày giao hàng", "ngayGiaoHang", "date", contract.ngayGiaoHang)}
                {renderInputField("Hiệu lực bảo đảm", "hieuLucBaoDam", "date", contract.hieuLucBaoDam)}
            </div>

            {renderInputField("Thông tin tu chỉnh", "tuChinhHopDong", "textarea", contract.tuChinhHopDong, "Nhập thông tin tu chỉnh nếu có")}
        </div>
    );

    const renderSectionDelivery = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🚚</span> Thông tin giao nhận
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderReadOnlyField("Giá trị hợp đồng", formatCurrency(contract.giaTriHopDong))}
                {renderCurrencyField("Giá trị hàng giao nhận (Đồng)", "giaTriGiaoNhan", contract.giaTriGiaoNhan, "0")}
            </div>

            {/* Progress */}
            {contract.giaTriHopDong && (
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Tiến độ giao hàng</span>
                        <span className="text-white">
                            {Math.min(100, Math.round(((contract.giaTriGiaoNhan || 0) / contract.giaTriHopDong) * 100))}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, ((contract.giaTriGiaoNhan || 0) / contract.giaTriHopDong) * 100)}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    const renderSectionAcceptance = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>✅</span> Thông tin nghiệm thu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderReadOnlyField("Giá trị đã giao nhận", formatCurrency(contract.giaTriGiaoNhan))}
                {renderCurrencyField("Giá trị hàng đã nghiệm thu (Đồng)", "giaTriNghiemThu", contract.giaTriNghiemThu, "0")}
            </div>

            {/* Progress */}
            {contract.giaTriGiaoNhan && (
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Tiến độ nghiệm thu</span>
                        <span className="text-white">
                            {Math.min(100, Math.round(((contract.giaTriNghiemThu || 0) / contract.giaTriGiaoNhan) * 100))}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, ((contract.giaTriNghiemThu || 0) / contract.giaTriGiaoNhan) * 100)}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    const renderSectionPayment = () => {
        const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
        const canEditPayment = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;
        const paymentInputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-right";

        const giaTriHD = contract.giaTriHopDong || 0;
        const daThanhToan = contract.giaTriThanhToan || 0;
        const conLai = giaTriHD - daThanhToan;

        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>💰</span> Thông tin thanh toán
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderReadOnlyField("Giá trị hợp đồng", formatCurrency(contract.giaTriHopDong))}
                    {renderReadOnlyField("Giá trị đã nghiệm thu", formatCurrency(contract.giaTriNghiemThu))}
                </div>

                {renderInputField("Ngày duyệt thanh toán", "ngayDuyetThanhToan", "date", contract.ngayDuyetThanhToan)}

                {contract.ngayDuyetThanhToan && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 flex items-center gap-2">
                            <span>✅</span>
                            Đã duyệt thanh toán ngày {new Date(contract.ngayDuyetThanhToan).toLocaleDateString("vi-VN")}
                        </p>
                    </div>
                )}

                {/* Phần dành cho TCKT */}
                <div className="space-y-4 pt-4">
                    <hr className="border-slate-700" />
                    <h4 className="text-md font-semibold text-purple-400 flex items-center gap-2">
                        💰 Thanh toán (TCKT)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Giá trị HĐ */}
                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Giá trị hợp đồng
                            </label>
                            <p className="text-xl font-bold text-white">
                                {formatCurrency(giaTriHD)}
                            </p>
                        </div>

                        {/* Đã thanh toán */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Đã thanh toán (Đồng)
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

                        {/* Còn lại */}
                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Còn lại
                            </label>
                            <p className={`text-xl font-bold ${conLai >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                {formatCurrency(conLai)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                = Giá trị hợp đồng - Đã thanh toán
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

                    {canEditPayment && !contract.daQuyetToan && (
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                name="updatePayment"
                                value="true"
                                disabled={loading}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20"
                            >
                                {loading ? "Đang xử lý..." : "💰 Thanh toán"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSectionWarranty = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🛡️</span> Thông tin bảo hành & đảm bảo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInputField("Hạn bảo hành hàng hóa", "hanBaoHanh", "date", contract.hanBaoHanh)}
            </div>

            {/* Warnings */}
            {contract.hieuLucBaoDam && new Date(contract.hieuLucBaoDam) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-orange-400 flex items-center gap-2">
                        <span>⚠️</span>
                        Đảm bảo thực hiện hợp đồng sắp hết hiệu lực!
                    </p>
                </div>
            )}

            {contract.hanBaoHanh && new Date(contract.hanBaoHanh) < new Date() && (
                <div className="p-4 bg-slate-500/10 border border-slate-500/30 rounded-lg">
                    <p className="text-slate-400 flex items-center gap-2">
                        <span>🏁</span>
                        Đã hết thời hạn bảo hành
                    </p>
                </div>
            )}
        </div>
    );

    const renderSectionSettlement = () => {
        const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
        const canEditSettlement = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;
        const settlementInputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

        const giaTriQT = contract.giaTriQuyetToan || 0;
        const daThanhToan = contract.giaTriThanhToan || 0;
        const canThanhToanThem = giaTriQT - daThanhToan;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>🏗️</span> Quyết toán công trình ĐTXD
                    </h3>
                    {contract.daQuyetToan && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                            Đã kết thúc
                        </span>
                    )}
                </div>

                {contract.isConstructionInvestment ? (
                    <div className="space-y-6">
                        {/* Người quyết toán (TCKT) */}
                        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Người quyết toán (TCKT)
                            </label>
                            {contract.nguoiThanhToan ? (
                                <div className="space-y-2">
                                    <p className="text-white font-medium">
                                        Hiện tại: {contract.nguoiThanhToan.hoTen}
                                    </p>
                                    {(userRole === "USER1_TCKT" || userRole === "ADMIN") && (
                                        <div className="flex gap-2">
                                            <select
                                                id="tcktSelectSettlement"
                                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                                            >
                                                <option value="">-- Chọn người mới --</option>
                                                {tcktUsers.filter(u => u.id !== contract.nguoiThanhToanId).map((u) => (
                                                    <option key={u.id} value={u.id}>{u.hoTen}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => initiateReassign("tckt", "tcktSelectSettlement")}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                            >
                                                Chuyển giao
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (userRole === "USER1_TCKT" || userRole === "ADMIN") ? (
                                <div className="flex gap-2">
                                    <select
                                        id="tcktSelectSettlement"
                                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                                    >
                                        <option value="">-- Chọn nhân viên TCKT --</option>
                                        {tcktUsers.map((u) => (
                                            <option key={u.id} value={u.id}>{u.hoTen}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => initiateReassign("tckt", "tcktSelectSettlement")}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        Giao việc
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Chưa được giao</p>
                            )}
                        </div>

                        {/* Các trường quyết toán */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                                    className={settlementInputClass + " text-right"}
                                />
                                {!canEditSettlement && contract.nguoiThanhToan && !contract.daQuyetToan && (
                                    <p className="text-xs text-orange-400 mt-1">
                                        * Chỉ {contract.nguoiThanhToan.hoTen} (TCKT) mới được phép sửa
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Ngày quyết toán
                                </label>
                                <input
                                    type="date"
                                    name="ngayQuyetToan"
                                    defaultValue={formatDate(contract.ngayQuyetToan)}
                                    disabled={!canEditSettlement}
                                    className={settlementInputClass}
                                />
                            </div>
                        </div>

                        {/* Cần thanh toán thêm */}
                        {contract.giaTriQuyetToan !== null && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                                    <label className="block text-sm font-medium text-purple-300 mb-1">
                                        Trị giá thừa so với hợp đồng
                                    </label>
                                    <p className={`text-xl font-bold ${giaTriQT - (contract.giaTriHopDong || 0) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                                        {formatCurrency(giaTriQT - (contract.giaTriHopDong || 0))}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        = Quyết toán - Giá trị hợp đồng
                                    </p>
                                </div>
                                <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                                    <label className="block text-sm font-medium text-amber-300 mb-1">
                                        Cần thanh toán thêm
                                    </label>
                                    <p className={`text-xl font-bold ${canThanhToanThem > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                                        {formatCurrency(canThanhToanThem)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        = Quyết toán - Đã thanh toán
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Nút xác nhận kết thúc */}
                        {canEditSettlement && contract.giaTriQuyetToan && !contract.daQuyetToan && (
                            <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-400 font-medium">Xác nhận kết thúc hợp đồng</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Sau khi xác nhận, hợp đồng sẽ không thể chỉnh sửa được nữa.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        name="markComplete"
                                        value="true"
                                        disabled={loading}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Đang xử lý..." : "✓ Xác nhận kết thúc"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
                        <span className="text-4xl mb-4 block">ℹ️</span>
                        <p className="text-slate-400">Hợp đồng này không thuộc loại công trình đầu tư xây dựng.</p>
                        <p className="text-sm text-slate-500 mt-2">Phần quyết toán công trình chỉ áp dụng cho các dự án xây dựng.</p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // Sections Array - Dễ dàng sắp xếp lại thứ tự
    // ========================================
    const sections = [
        { id: "info", render: renderSectionInfo, requiresComplete: false },
        { id: "delivery", render: renderSectionDelivery, requiresComplete: true, title: "Giao nhận", icon: "🚚" },
        { id: "acceptance", render: renderSectionAcceptance, requiresComplete: true, title: "Nghiệm thu", icon: "✅" },
        { id: "payment", render: renderSectionPayment, requiresComplete: true, title: "Thanh toán", icon: "💰" },
        { id: "warranty", render: renderSectionWarranty, requiresComplete: true, title: "Bảo hành", icon: "🛡️" },
        { id: "settlement", render: renderSectionSettlement, requiresComplete: true, title: "Quyết toán", icon: "🏗️" },
    ];

    // ========================================
    // Main Render
    // ========================================
    return (
        <div className="space-y-6">
            {/* Warning for incomplete contract */}
            {!isContractComplete && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span>Vui lòng hoàn thiện tất cả thông tin cơ bản (Tên hợp đồng, Giá trị, Ngày ký, Ngày hiệu lực, Ngày giao hàng, Hiệu lực bảo đảm) trước khi nhập liệu các mục khác.</span>
                </div>
            )}

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === "success"
                        ? "bg-green-500/10 border border-green-500/50 text-green-400"
                        : "bg-red-500/10 border border-red-500/50 text-red-400"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Content - Single Page Layout */}
            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                {sections.map((section, index) => {
                    // Skip sections that require complete contract
                    if (section.requiresComplete && !isContractComplete) {
                        return null;
                    }

                    return (
                        <div key={section.id}>
                            {/* Divider between sections (skip for first one) */}
                            {index > 0 && section.title && (
                                <SectionDivider title={section.title} icon={section.icon!} />
                            )}
                            {section.render()}
                        </div>
                    );
                })}

                {/* Submit button */}
                {canEdit && (
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                )}
            </form>

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
        </div>
    );
}
