"use client";

import { useRouter } from "next/navigation";

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
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all">
                        📊 Xuất Excel
                    </button>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all">
                        📄 Xuất PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
