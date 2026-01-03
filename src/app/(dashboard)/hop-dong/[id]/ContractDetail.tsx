"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ExecutorCell from "@/components/contracts/ExecutorCell";

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

type TabType = "info" | "delivery" | "acceptance" | "payment" | "warranty";

export default function ContractDetail({ contract, canEdit, userRole, userId, users = [], tcktUsers = [] }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("info");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: "info", label: "Thông tin", icon: "📋" },
        { id: "delivery", label: "Giao nhận", icon: "🚚" },
        { id: "acceptance", label: "Nghiệm thu", icon: "✅" },
        { id: "payment", label: "Thanh toán", icon: "💰" },
        { id: "warranty", label: "Bảo hành", icon: "🛡️" },
    ];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
    };

    const formatCurrency = (value: number | null) => {
        if (!value) return "";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const data: Record<string, unknown> = {};

        formData.forEach((value, key) => {
            if (value !== "") {
                data[key] = value;
            }
        });

        try {
            const res = await fetch(`/api/hop-dong/${contract.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            setMessage({ type: "success", text: "Cập nhật thành công!" });
            router.refresh();

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Có lỗi xảy ra",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderInputField = (
        label: string,
        name: string,
        type: "text" | "number" | "date" | "textarea",
        value: string | number | null,
        placeholder?: string
    ) => {
        // Kiểm tra quyền sửa đặc biệt:
        const isUser2 = userRole === "USER2";
        const isUser1 = userRole === "USER1";

        // User 2 (người thực hiện) không được sửa Tên HĐ và Ngày ký nếu đã có dữ liệu
        const isRestrictedFieldForUser2 = name === "tenHopDong" || name === "ngayKy";
        const hasData = value !== null && value !== "";

        // USER1 (Lãnh đạo) chỉ tạo HĐ, không tham gia nhập liệu chi tiết thực hiện
        // nên sẽ bị khóa tất cả các trường chi tiết sau khi tạo.
        const isDisabled = !canEdit ||
            (isUser2 && isRestrictedFieldForUser2 && hasData) ||
            isUser1;

        const inputClass =
            "w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

        return (
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {label}
                </label>
                {type === "textarea" ? (
                    <textarea
                        name={name}
                        defaultValue={value || ""}
                        disabled={isDisabled}
                        placeholder={placeholder}
                        rows={3}
                        className={inputClass}
                    />
                ) : (
                    <input
                        type={type}
                        name={name}
                        defaultValue={type === "date" ? formatDate(value as string) : (value || "")}
                        disabled={isDisabled}
                        placeholder={placeholder}
                        step={type === "number" ? "0.01" : undefined}
                        className={inputClass}
                    />
                )}
                {isDisabled && isUser2 && isRestrictedFieldForUser2 && hasData && (
                    <p className="text-xs text-orange-400 mt-1">
                        * Chỉ quản lý mới có thể chỉnh sửa thông tin này
                    </p>
                )}
            </div>
        );
    };

    const renderReadOnlyField = (label: string, value: string | null | undefined) => (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
                {label}
            </label>
            <p className="text-white">{value || "—"}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

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

            {/* Content */}
            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                {/* Tab: Thông tin */}
                {activeTab === "info" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderReadOnlyField("Số hợp đồng", contract.soHopDong)}
                            {renderReadOnlyField("Người giao", contract.nguoiGiao?.hoTen)}

                            {/* Người thực hiện - chỉ USER1 (Lãnh đạo hợp đồng) mới có quyền chuyển giao */}
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
                                                    onClick={async () => {
                                                        const newId = (document.getElementById("executorSelect") as HTMLSelectElement)?.value;
                                                        if (!newId) {
                                                            setMessage({ type: "error", text: "Vui lòng chọn người thực hiện" });
                                                            return;
                                                        }
                                                        try {
                                                            const res = await fetch(`/api/hop-dong/${contract.id}/reassign`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ newExecutorId: newId }),
                                                            });
                                                            if (res.ok) {
                                                                setMessage({ type: "success", text: "Đã chuyển giao hợp đồng!" });
                                                                router.refresh();
                                                            } else {
                                                                const err = await res.json();
                                                                setMessage({ type: "error", text: err.message });
                                                            }
                                                        } catch {
                                                            setMessage({ type: "error", text: "Lỗi khi chuyển giao" });
                                                        }
                                                    }}
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
                                                onClick={async () => {
                                                    const newId = (document.getElementById("executorSelect") as HTMLSelectElement)?.value;
                                                    if (!newId) {
                                                        setMessage({ type: "error", text: "Vui lòng chọn người thực hiện" });
                                                        return;
                                                    }
                                                    try {
                                                        const res = await fetch(`/api/hop-dong/${contract.id}`, {
                                                            method: "PUT",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ nguoiThucHienId: newId }),
                                                        });
                                                        if (res.ok) {
                                                            setMessage({ type: "success", text: "Đã giao hợp đồng!" });
                                                            router.refresh();
                                                        } else {
                                                            const err = await res.json();
                                                            setMessage({ type: "error", text: err.message });
                                                        }
                                                    } catch {
                                                        setMessage({ type: "error", text: "Lỗi khi giao việc" });
                                                    }
                                                }}
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
                            {renderInputField("Giá trị hợp đồng (VNĐ)", "giaTriHopDong", "number", contract.giaTriHopDong, "0")}
                            {renderInputField("Ngày ký", "ngayKy", "date", contract.ngayKy)}
                            {renderInputField("Ngày hiệu lực", "ngayHieuLuc", "date", contract.ngayHieuLuc)}
                            {renderInputField("Ngày giao hàng", "ngayGiaoHang", "date", contract.ngayGiaoHang)}
                            {renderInputField("Hiệu lực bảo đảm", "hieuLucBaoDam", "date", contract.hieuLucBaoDam)}
                        </div>

                        {renderInputField("Thông tin tu chỉnh", "tuChinhHopDong", "textarea", contract.tuChinhHopDong, "Nhập thông tin tu chỉnh nếu có")}

                        {/* Phần quyết toán công trình đầu tư xây dựng */}
                        {contract.isConstructionInvestment && (
                            <>
                                <hr className="border-slate-700" />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        🏗️ Quyết toán công trình đầu tư xây dựng
                                    </h3>

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
                                                            id="tcktSelect"
                                                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                                                        >
                                                            <option value="">-- Chọn người mới --</option>
                                                            {tcktUsers.filter(u => u.id !== contract.nguoiThanhToanId).map((u) => (
                                                                <option key={u.id} value={u.id}>{u.hoTen}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const newId = (document.getElementById("tcktSelect") as HTMLSelectElement)?.value;
                                                                if (!newId) {
                                                                    setMessage({ type: "error", text: "Vui lòng chọn nhân viên TCKT" });
                                                                    return;
                                                                }
                                                                try {
                                                                    const res = await fetch(`/api/hop-dong/${contract.id}/assign-tckt`, {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ nguoiThanhToanId: newId }),
                                                                    });
                                                                    if (res.ok) {
                                                                        setMessage({ type: "success", text: "Đã chuyển giao việc quyết toán!" });
                                                                        router.refresh();
                                                                    } else {
                                                                        const err = await res.json();
                                                                        setMessage({ type: "error", text: err.message });
                                                                    }
                                                                } catch {
                                                                    setMessage({ type: "error", text: "Lỗi khi giao việc" });
                                                                }
                                                            }}
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
                                                    id="tcktSelect"
                                                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                                                >
                                                    <option value="">-- Chọn nhân viên TCKT --</option>
                                                    {tcktUsers.map((u) => (
                                                        <option key={u.id} value={u.id}>{u.hoTen}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const newId = (document.getElementById("tcktSelect") as HTMLSelectElement)?.value;
                                                        if (!newId) {
                                                            setMessage({ type: "error", text: "Vui lòng chọn nhân viên TCKT" });
                                                            return;
                                                        }
                                                        try {
                                                            const res = await fetch(`/api/hop-dong/${contract.id}/assign-tckt`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ nguoiThanhToanId: newId }),
                                                            });
                                                            if (res.ok) {
                                                                setMessage({ type: "success", text: "Đã giao việc quyết toán!" });
                                                                router.refresh();
                                                            } else {
                                                                const err = await res.json();
                                                                setMessage({ type: "error", text: err.message });
                                                            }
                                                        } catch {
                                                            setMessage({ type: "error", text: "Lỗi khi giao việc" });
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    Giao việc
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 italic">Chưa được giao</p>
                                        )}
                                    </div>

                                    {/* Các trường quyết toán - chỉ nhân viên TCKT được gán mới có thể sửa */}
                                    {(() => {
                                        const isTCKTAssigned = userRole === "USER2_TCKT" && contract.nguoiThanhToanId === userId;
                                        const canEditSettlement = userRole === "ADMIN" || isTCKTAssigned;
                                        const settlementInputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

                                        return (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                            Trị giá quyết toán công trình (VNĐ)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="giaTriQuyetToan"
                                                            defaultValue={contract.giaTriQuyetToan || ""}
                                                            disabled={!canEditSettlement}
                                                            placeholder="0"
                                                            step="0.01"
                                                            className={settlementInputClass}
                                                        />
                                                        {!canEditSettlement && contract.nguoiThanhToan && (
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

                                                {/* Trị giá thừa sau quyết toán - tính tự động */}
                                                {contract.giaTriHopDong && contract.giaTriQuyetToan !== null && (
                                                    <div className="p-4 bg-slate-900/50 border border-slate-600/30 rounded-lg">
                                                        <label className="block text-sm font-medium text-slate-400 mb-1">
                                                            Trị giá thừa sau quyết toán
                                                        </label>
                                                        <p className={`text-xl font-bold ${(contract.giaTriHopDong - (contract.giaTriQuyetToan || 0)) >= 0
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                            }`}>
                                                            {formatCurrency(contract.giaTriHopDong - (contract.giaTriQuyetToan || 0))}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            = Giá trị hợp đồng ({formatCurrency(contract.giaTriHopDong)}) - Trị giá quyết toán ({formatCurrency(contract.giaTriQuyetToan)})
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Tab: Giao nhận */}
                {activeTab === "delivery" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Thông tin giao nhận</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderReadOnlyField("Giá trị hợp đồng", formatCurrency(contract.giaTriHopDong))}
                            {renderInputField("Giá trị hàng giao nhận (VNĐ)", "giaTriGiaoNhan", "number", contract.giaTriGiaoNhan, "0")}
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
                )}

                {/* Tab: Nghiệm thu */}
                {activeTab === "acceptance" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Thông tin nghiệm thu</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderReadOnlyField("Giá trị đã giao nhận", formatCurrency(contract.giaTriGiaoNhan))}
                            {renderInputField("Giá trị hàng đã nghiệm thu (VNĐ)", "giaTriNghiemThu", "number", contract.giaTriNghiemThu, "0")}
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
                )}

                {/* Tab: Thanh toán */}
                {activeTab === "payment" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Thông tin thanh toán</h3>

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
                    </div>
                )}

                {/* Tab: Bảo hành */}
                {activeTab === "warranty" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Thông tin bảo hành & đảm bảo</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* {renderInputField("Hiệu lực bảo đảm thực hiện HĐ", "hieuLucBaoDam", "date", contract.hieuLucBaoDam)} */}
                            {renderInputField("Hạn bảo hành hàng hóa", "hanBaoHanh", "date", contract.hanBaoHanh)}
                        </div>

                        {/* Warnings */}
                        {contract.hieuLucBaoDam && new Date(contract.hieuLucBaoDam) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                <p className="text-orange-400 flex items-center gap-2">
                                    <span>⚠️</span>
                                    Đảm bảo thực hiện HĐ sắp hết hiệu lực!
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
                )}

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
        </div>
    );
}
