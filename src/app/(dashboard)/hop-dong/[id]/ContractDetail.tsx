"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    nguoiThucHien: { hoTen: string } | null;
}

interface Props {
    contract: Contract;
    canEdit: boolean;
    userRole?: string;
}

type TabType = "info" | "delivery" | "acceptance" | "payment" | "warranty";

export default function ContractDetail({ contract, canEdit, userRole }: Props) {
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
        // User 2 (người thực hiện) không được sửa Tên HĐ và Ngày ký nếu đã có dữ liệu
        const isUser2 = userRole === "USER2";
        const isRestrictedField = name === "tenHopDong" || name === "ngayKy";
        const hasData = value !== null && value !== "";
        const isDisabled = !canEdit || (isUser2 && isRestrictedField && hasData);

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
                {isDisabled && isUser2 && isRestrictedField && hasData && (
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
                            {renderReadOnlyField("Người thực hiện", contract.nguoiThucHien?.hoTen)}
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
                            {renderInputField("Hiệu lực bảo đảm thực hiện HĐ", "hieuLucBaoDam", "date", contract.hieuLucBaoDam)}
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
