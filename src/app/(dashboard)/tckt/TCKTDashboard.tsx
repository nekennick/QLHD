"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignmentConfirmDialog from "@/components/contracts/AssignmentConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

interface Contract {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    giaTriHopDong: number | null;
    ngayDuyetThanhToan: string | null;
    nguoiThanhToanId: string | null;
    nguoiGiao: { id: string; hoTen: string } | null;
    nguoiThucHien: { id: string; hoTen: string } | null;
    nguoiThanhToan: { id: string; hoTen: string } | null;
}

interface Staff {
    id: string;
    hoTen: string;
}

interface TCKTDashboardProps {
    contracts: Contract[];
    staff: Staff[];
    userRole: string;
    userId: string;
}

export default function TCKTDashboard({
    contracts,
    staff,
    userRole,
    userId,
}: TCKTDashboardProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    // State cho hộp thoại xác nhận
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<{ contractId: string, staffId: string } | null>(null);

    // Filter contracts for USER2_TCKT
    const displayContracts =
        userRole === "USER2_TCKT"
            ? contracts.filter((c) => c.nguoiThanhToanId === userId)
            : contracts;

    const handleAssignClick = (contractId: string, staffId: string) => {
        setAssignTarget({ contractId, staffId });
        setConfirmOpen(true);
    };

    const handleConfirmAssign = async () => {
        if (!assignTarget) return;
        const { contractId, staffId } = assignTarget;

        setConfirmOpen(false);
        setLoading(contractId);
        try {
            const res = await fetch(`/api/hop-dong/${contractId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nguoiThanhToanId: staffId || null }),
            });

            if (!res.ok) {
                const data = await res.json();
                showToast(data.message || "Có lỗi xảy ra", "error");
                return;
            }

            router.refresh();
        } catch {
            showToast("Có lỗi xảy ra", "error");
        } finally {
            setLoading(null);
            setAssignTarget(null);
        }
    };

    const handleCancelAssign = () => {
        setConfirmOpen(false);
        setAssignTarget(null);
    };

    const formatCurrency = (value: number | null) => {
        if (!value) return "-";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-slate-600 dark:text-slate-400 text-sm bg-slate-100 dark:bg-slate-900/50">
                            <th className="px-6 py-4 font-medium">Số hợp đồng</th>
                            <th className="px-6 py-4 font-medium">Tên hợp đồng</th>
                            <th className="px-6 py-4 font-medium">Giá trị</th>
                            <th className="px-6 py-4 font-medium">Ngày đề nghị</th>
                            <th className="px-6 py-4 font-medium">Người thực hiện hợp đồng</th>
                            {["USER1_TCKT", "ADMIN"].includes(userRole) && (
                                <th className="px-6 py-4 font-medium">Giao cho</th>
                            )}
                            <th className="px-6 py-4 font-medium text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-300">
                        {displayContracts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    Không có hợp đồng chờ thanh toán
                                </td>
                            </tr>
                        ) : (
                            displayContracts.map((contract) => (
                                <tr
                                    key={contract.id}
                                    className="border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {contract.soHopDong}
                                    </td>
                                    <td className="px-6 py-4">
                                        {contract.tenHopDong || (
                                            <span className="text-slate-500">Chưa có</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {formatCurrency(contract.giaTriHopDong)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {formatDate(contract.ngayDuyetThanhToan)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {contract.nguoiThucHien?.hoTen || "-"}
                                    </td>
                                    {["USER1_TCKT", "ADMIN"].includes(userRole) && (
                                        <td className="px-6 py-4">
                                            <select
                                                value={contract.nguoiThanhToanId || ""}
                                                onChange={(e) =>
                                                    handleAssignClick(contract.id, e.target.value)
                                                }
                                                disabled={loading === contract.id}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="">-- Chọn --</option>
                                                {staff.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.hoTen}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/hop-dong/${contract.id}`}
                                            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm"
                                        >
                                            Xem chi tiết →
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AssignmentConfirmDialog
                isOpen={confirmOpen}
                title="Giao việc thanh toán"
                fromLabel="Hợp đồng:"
                currentExecutor={contracts.find(c => c.id === assignTarget?.contractId)?.soHopDong || "—"}
                toLabel="Giao cho:"
                newExecutor={staff.find(s => s.id === assignTarget?.staffId)?.hoTen || "Chưa giao"}
                description="Xác nhận phân công nhân viên thực hiện thanh toán cho hợp đồng này?"
                onConfirm={handleConfirmAssign}
                onCancel={handleCancelAssign}
            />

            {/* Info */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-blue-50 dark:bg-blue-500/10">
                <h3 className="text-blue-600 dark:text-blue-400 font-medium mb-2">💡 Hướng dẫn</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• <strong>Lãnh đạo TCKT</strong>: Chọn nhân viên trong cột &ldquo;Giao cho&rdquo; để phân công | Bấm &ldquo;Quyết toán&rdquo; để kết thúc nhanh</li>
                    <li>• <strong>Nhân viên TCKT</strong>: Bấm &ldquo;Cập nhật&rdquo; để vào chi tiết thanh toán và quyết toán</li>
                </ul>
            </div>
        </div>
    );
}
