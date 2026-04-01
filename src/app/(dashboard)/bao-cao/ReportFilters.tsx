"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface User {
    id: string;
    hoTen: string;
}

interface Props {
    users: User[];
    currentUserId?: string;
    reportType: string;
}

export default function ReportFilters({ users, currentUserId, reportType }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [exporting, setExporting] = useState<string | null>(null);

    const isWarranty = searchParams.get("isWarranty") === "true";
    const isCompleted = searchParams.get("isCompleted") === "true";

    const buildUrl = (type?: string, user?: string, overrides?: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (type) params.set("type", type);
        
        if (user !== undefined) {
            if (user) params.set("nguoiThucHien", user);
            else params.delete("nguoiThucHien");
        }
        
        if (overrides) {
            Object.entries(overrides).forEach(([k, v]) => {
                if (v === "false") params.delete(k); // Clean url
                else params.set(k, v);
            });
        }
        
        const queryString = params.toString();
        return `/bao-cao${queryString ? `?${queryString}` : ""}`;
    };

    const handleUserChange = (userId: string) => {
        router.push(buildUrl(reportType, userId));
    };

    const handleFilterChange = (key: string, value: boolean) => {
        router.push(buildUrl(reportType, currentUserId, { [key]: value.toString() }));
    };

    const handleExport = async (format: "docx" | "xlsx" | "pdf") => {
        setExporting(format);
        try {
            const params = new URLSearchParams(searchParams.toString());
            params.set("format", format);
            if (reportType) params.set("type", reportType);
            if (currentUserId) params.set("nguoiThucHien", currentUserId);

            const response = await fetch(`/api/bao-cao/export?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Export failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const contentDisposition = response.headers.get("Content-Disposition");
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            a.download = filenameMatch ? filenameMatch[1] : `bao-cao.${format}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            showToast("Xuất báo cáo thất bại. Vui lòng thử lại.", "error");
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-slate-600 dark:text-slate-400">Người thực hiện:</span>
                <select
                    value={currentUserId || ""}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-transparent focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Tất cả</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.hoTen}
                        </option>
                    ))}
                </select>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    <input
                        type="checkbox"
                        checked={isWarranty}
                        onChange={(e) => handleFilterChange("isWarranty", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-800"
                    />
                    Đang bảo hành
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => handleFilterChange("isCompleted", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-800"
                    />
                    Đã hoàn tất
                </label>

                {/* Export buttons */}
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => handleExport("docx")}
                        disabled={exporting !== null}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                        {exporting === "docx" ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <span>📝</span>
                        )}
                        Xuất Word
                    </button>
                    <button
                        onClick={() => handleExport("xlsx")}
                        disabled={exporting !== null}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                        {exporting === "xlsx" ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <span>📊</span>
                        )}
                        Xuất Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
