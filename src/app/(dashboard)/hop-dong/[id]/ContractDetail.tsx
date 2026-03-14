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

        // Client-side validation: giaTriThanhToan có data → ngayDuyetThanhToan bắt buộc
        const ngayDuyet = data.ngayDuyetThanhToan as string | null | undefined;
        const effectiveGiaTriTT = giaTriTT ?? (contract.giaTriThanhToan ? parseFloat(String(contract.giaTriThanhToan)) : null);
        const effectiveNgayDuyet = ngayDuyet !== undefined ? ngayDuyet : contract.ngayDuyetThanhToan;
        if (effectiveGiaTriTT && !effectiveNgayDuyet) {
            showToast("Phải có \"Ngày duyệt tạm ứng, thanh toán\" trước khi nhập trị giá thanh toán", "error");
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
    // Render Helper Functions — Compact Inline Layout
    // ========================================
    const inputClass = "flex-1 px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const isFieldEditable = canEdit && (
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

    const calcPercent = (value: number | null, base: number | null) => {
        if (!value || !base || base === 0) return null;
        return Math.min(100, Math.round((value / base) * 100));
    };

    // Inline row: label left, input right
    const Row = ({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) => (
        <div className={`flex items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-700/30 ${highlight ? 'bg-yellow-50/50 dark:bg-yellow-900/10 -mx-4 px-4 rounded' : ''}`}>
            <span className={`text-sm min-w-[200px] md:min-w-[280px] pt-1 shrink-0 ${highlight ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {label}
            </span>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );

    const ReadOnlyValue = ({ value }: { value: string | null | undefined }) => (
        <span className="text-sm text-slate-900 dark:text-white py-1 inline-block">{value || "—"}</span>
    );

    const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
    const canEditSettlement = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;
    const canEditPayment = (userRole === "ADMIN" || isTCKTAssigned) && !contract.daQuyetToan;

    const giaTriQT = contract.giaTriQuyetToan || 0;
    const giaTriTTCalc = contract.giaTriThanhToan || 0;
    const giaTriVTTDaXuLy = contract.giaTriVatTuThuaDaXuLy || 0;
    const vatTuThua = giaTriTTCalc - giaTriQT;
    const vatTuThuaChuaXuLy = giaTriTTCalc - (giaTriQT + giaTriVTTDaXuLy);
    const giaTriHD = contract.giaTriHopDong || 0;

    // ========================================
    // Main Render
    // ========================================
    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 md:p-6 shadow-sm dark:shadow-none">
                <div className="space-y-0">

                    {/* === THÔNG TIN GIAO NHẬN === */}
                    <Row label="Người giao HĐ:">
                        <ReadOnlyValue value={contract.nguoiGiao?.hoTen} />
                    </Row>

                    <Row label="Người quản lý HĐ:">
                        {contract.nguoiThucHien ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-slate-900 dark:text-white py-1">{contract.nguoiThucHien.hoTen}</span>
                                {userRole === "USER1" && (
                                    <div className="flex items-center gap-1">
                                        <select
                                            id="executorSelect"
                                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white"
                                        >
                                            <option value="">-- Chọn người mới --</option>
                                            {users.filter(u => u.id !== contract.nguoiThucHienId).map((u) => (
                                                <option key={u.id} value={u.id}>{u.hoTen}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => initiateReassign("executor", "executorSelect")}
                                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                        >
                                            Giao
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : userRole === "USER1" ? (
                            <div className="flex items-center gap-1">
                                <select
                                    id="executorSelect"
                                    className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white"
                                >
                                    <option value="">-- Chọn người thực hiện --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.hoTen}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => initiateReassign("executor", "executorSelect")}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                >
                                    Giao
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400 italic py-1">Chưa được giao</span>
                        )}
                    </Row>

                    {/* === THÔNG TIN HỢP ĐỒNG === */}
                    <Row label="Số hợp đồng:">
                        <input type="text" name="soHopDong" defaultValue={contract.soHopDong ?? ""} disabled={!isFieldEditable} className={inputClass} />
                    </Row>

                    <Row label="Ngày ký HĐ:">
                        <input type="date" name="ngayKy" defaultValue={formatDate(contract.ngayKy)} disabled={!isFieldEditable} className={inputClass + " max-w-[200px]"} />
                    </Row>

                    <Row label="Tên HĐ:">
                        <input type="text" name="tenHopDong" defaultValue={contract.tenHopDong ?? ""} disabled={!isFieldEditable} placeholder="Nhập tên hợp đồng" className={inputClass} />
                    </Row>

                    <Row label="Hợp đồng công trình ĐTXD:">
                        <input
                            type="checkbox"
                            name="isConstructionInvestment"
                            defaultChecked={contract.isConstructionInvestment}
                            disabled={!isFieldEditable}
                            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-1"
                        />
                    </Row>

                    <Row label="Giá trị hợp đồng (Đồng):">
                        <input type="text" name="giaTriHopDong" defaultValue={formatNumberWithSeparator(contract.giaTriHopDong)} onInput={handleCurrencyInput} disabled={!isFieldEditable} placeholder="0" className={inputClass + " text-right max-w-[200px]"} />
                    </Row>

                    <Row label="HĐ hiệu lực từ ngày:">
                        <div className="flex items-center gap-2 flex-wrap">
                            <input type="date" name="ngayHieuLuc" defaultValue={formatDate(contract.ngayHieuLuc)} disabled={!isFieldEditable} className={inputClass + " max-w-[180px]"} />
                            <span className="text-sm text-slate-500">đến ngày</span>
                            <input type="date" name="hieuLucBaoDam" defaultValue={formatDate(contract.hieuLucBaoDam)} disabled={!isFieldEditable} className={inputClass + " max-w-[180px]"} />
                        </div>
                    </Row>

                    <Row label="Ngày giao hàng:">
                        <input type="date" name="ngayGiaoHang" defaultValue={formatDate(contract.ngayGiaoHang)} disabled={!isFieldEditable} className={inputClass + " max-w-[200px]"} />
                    </Row>

                    <Row label="Thông tin tu chỉnh:">
                        <textarea name="tuChinhHopDong" defaultValue={contract.tuChinhHopDong ?? ""} disabled={!isFieldEditable} placeholder="Nhập thông tin tu chỉnh nếu có" rows={2} className={inputClass} />
                    </Row>

                    {/* === TIẾN ĐỘ THỰC HIỆN === */}
                    <div className="pt-3 pb-1">
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tiến độ thực hiện</div>
                    </div>

                    <Row label="Giá trị hàng giao nhận (Đồng):">
                        <div className="flex items-center gap-2">
                            <input type="text" name="giaTriGiaoNhan" defaultValue={formatNumberWithSeparator(contract.giaTriGiaoNhan)} onInput={handleCurrencyInput} disabled={!isFieldEditable} placeholder="0" className={inputClass + " text-right max-w-[200px]"} />
                            {calcPercent(contract.giaTriGiaoNhan, contract.giaTriHopDong) !== null && (
                                <span className="text-xs text-slate-500 whitespace-nowrap">đạt {calcPercent(contract.giaTriGiaoNhan, contract.giaTriHopDong)}%</span>
                            )}
                        </div>
                    </Row>

                    <Row label="Giá trị hàng nghiệm thu (Đồng):">
                        <div className="flex items-center gap-2">
                            <input type="text" name="giaTriNghiemThu" defaultValue={formatNumberWithSeparator(contract.giaTriNghiemThu)} onInput={handleCurrencyInput} disabled={!isFieldEditable} placeholder="0" className={inputClass + " text-right max-w-[200px]"} />
                            {calcPercent(contract.giaTriNghiemThu, contract.giaTriHopDong) !== null && (
                                <span className="text-xs text-slate-500 whitespace-nowrap">đạt {calcPercent(contract.giaTriNghiemThu, contract.giaTriHopDong)}%</span>
                            )}
                        </div>
                    </Row>

                    <Row label="Hạn bảo hành:">
                        <input type="date" name="hanBaoHanh" defaultValue={formatDate(contract.hanBaoHanh)} disabled={!isFieldEditable} className={inputClass + " max-w-[200px]"} />
                    </Row>

                    <Row label="Ngày duyệt tạm ứng, thanh toán:">
                        <input type="date" name="ngayDuyetThanhToan" defaultValue={formatDate(contract.ngayDuyetThanhToan)} disabled={!isFieldEditable} className={inputClass + " max-w-[200px]"} />
                    </Row>

                    {/* === QUYẾT TOÁN ĐTXD === */}
                    {contract.isConstructionInvestment && (
                        <>
                            <Row label="Giá trị quyết toán công trình ĐTXD (Đồng):">
                                <div>
                                    <input
                                        type="text"
                                        name="giaTriQuyetToan"
                                        defaultValue={formatNumberWithSeparator(contract.giaTriQuyetToan)}
                                        onInput={handleCurrencyInput}
                                        disabled={!canEditSettlement}
                                        placeholder="0"
                                        className={inputClass + " text-right max-w-[250px]"}
                                    />
                                    {!canEditSettlement && contract.nguoiThanhToan && !contract.daQuyetToan && (
                                        <p className="text-xs text-orange-400 mt-0.5">* Chỉ {contract.nguoiThanhToan.hoTen} (TCKT) mới được sửa</p>
                                    )}
                                </div>
                            </Row>

                            {contract.giaTriThanhToan !== null && contract.giaTriQuyetToan !== null && vatTuThua > 0 && (
                                <>
                                    <Row label="Giá trị vật tư thừa:">
                                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 py-1 inline-block">
                                            {formatCurrency(vatTuThua)}
                                        </span>
                                    </Row>

                                    <Row label="Trị giá vật tư thừa đã xử lý (Đồng):">
                                        <input
                                            type="text"
                                            name="giaTriVatTuThuaDaXuLy"
                                            defaultValue={formatNumberWithSeparator(contract.giaTriVatTuThuaDaXuLy)}
                                            onInput={handleCurrencyInput}
                                            disabled={!canEditSettlement}
                                            placeholder="0"
                                            className={inputClass + " text-right max-w-[200px]"}
                                        />
                                    </Row>

                                    <Row label="Vật tư thừa chưa xử lý:">
                                        <span className={`text-sm font-semibold py-1 inline-block ${vatTuThuaChuaXuLy <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formatCurrency(vatTuThuaChuaXuLy)}
                                        </span>
                                    </Row>
                                </>
                            )}
                        </>
                    )}

                    {/* === THANH TOÁN (TCKT) === */}
                    <div className="pt-3 pb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thanh toán</span>
                            {contract.daQuyetToan && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                    Đã kết thúc
                                </span>
                            )}
                        </div>
                    </div>

                    <Row label="Người giao việc thanh toán:">
                        <ReadOnlyValue value={contract.nguoiGiaoThanhToan?.hoTen} />
                    </Row>

                    <Row label="Người thanh toán:">
                        {contract.nguoiThanhToan ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-slate-900 dark:text-white py-1">{contract.nguoiThanhToan.hoTen}</span>
                                {userRole === "ADMIN" && (
                                    <div className="flex items-center gap-1">
                                        <select
                                            id="tcktSelect"
                                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white"
                                        >
                                            <option value="">-- Chọn người mới --</option>
                                            {tcktUsers.filter(u => u.id !== contract.nguoiThanhToanId).map((u) => (
                                                <option key={u.id} value={u.id}>{u.hoTen}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => initiateReassign("tckt", "tcktSelect")}
                                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                        >
                                            Giao
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : userRole === "ADMIN" ? (
                            <div className="flex items-center gap-1">
                                <select
                                    id="tcktSelect"
                                    className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white"
                                >
                                    <option value="">-- Chọn nhân viên TCKT --</option>
                                    {tcktUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.hoTen}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => initiateReassign("tckt", "tcktSelect")}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                >
                                    Giao
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400 italic py-1">Chưa được giao</span>
                        )}
                    </Row>

                    <Row label="Trị giá thanh toán (Đồng):">
                        <div className="flex items-center gap-2">
                            <div>
                                <input
                                    type="text"
                                    name="giaTriThanhToan"
                                    defaultValue={formatNumberWithSeparator(contract.giaTriThanhToan)}
                                    onInput={handleCurrencyInput}
                                    disabled={!canEditPayment}
                                    placeholder="0"
                                    className={inputClass + " text-right max-w-[200px]"}
                                />
                                {!canEditPayment && contract.nguoiThanhToan && !contract.daQuyetToan && (
                                    <p className="text-xs text-orange-400 mt-0.5">* Chỉ {contract.nguoiThanhToan.hoTen} (TCKT)</p>
                                )}
                            </div>
                            {calcPercent(contract.giaTriThanhToan, contract.giaTriHopDong) !== null && (
                                <span className="text-xs text-slate-500 whitespace-nowrap">đạt {calcPercent(contract.giaTriThanhToan, contract.giaTriHopDong)}%</span>
                            )}
                        </div>
                    </Row>

                    {/* Warnings */}
                    {contract.hieuLucBaoDam && new Date(contract.hieuLucBaoDam) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <div className="py-2 px-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded text-sm text-orange-600 dark:text-orange-400 mt-2">
                            ⚠️ Đảm bảo thực hiện HĐ sắp hết hiệu lực!
                        </div>
                    )}

                    {contract.hanBaoHanh && new Date(contract.hanBaoHanh) < new Date() && (
                        <div className="py-2 px-3 bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/30 rounded text-sm text-slate-600 dark:text-slate-400 mt-1">
                            🏁 Đã hết thời hạn bảo hành
                        </div>
                    )}

                    {contract.daQuyetToan && (
                        <div className="py-2 px-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                            ✅ Hợp đồng đã kết thúc
                            {contract.ngayQuyetToanHoanTat && (
                                <span className="ml-1 opacity-75">(ngày {new Date(contract.ngayQuyetToanHoanTat).toLocaleDateString("vi-VN")})</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit button */}
                {canEdit && (
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                )}
            </form>

            {/* Nút Xóa HĐ */}
            {canDelete && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
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
