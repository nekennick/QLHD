"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const [exporting, setExporting] = useState<string | null>(null);

    const buildUrl = (type?: string, user?: string) => {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (user) params.set("nguoiThucHien", user);
        const queryString = params.toString();
        return `/bao-cao${queryString ? `?${queryString}` : ""}`;
    };

    const handleUserChange = (userId: string) => {
        router.push(buildUrl(reportType, userId));
    };

    const handleExport = async (format: "docx" | "xlsx" | "pdf") => {
        setExporting(format);
        try {
            const params = new URLSearchParams();
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
            alert("Xuất báo cáo thất bại. Vui lòng thử lại.");
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-slate-400">Người thực hiện:</span>
                <select
                    value={currentUserId || ""}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Tất cả</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.hoTen}
                        </option>
                    ))}
                </select>

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
