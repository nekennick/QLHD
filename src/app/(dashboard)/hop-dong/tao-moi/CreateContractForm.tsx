"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    hoTen: string;
}

export default function CreateContractForm({ users }: { users: User[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            soHopDong: formData.get("soHopDong"),
            nguoiThucHienId: formData.get("nguoiThucHienId") || null,
        };

        try {
            const res = await fetch("/api/hop-dong", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Có lỗi xảy ra");
            }

            const result = await res.json();
            router.push(`/hop-dong/${result.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="soHopDong" className="block text-sm font-medium text-slate-300 mb-2">
                    Số hợp đồng <span className="text-red-400">*</span>
                </label>
                <input
                    id="soHopDong"
                    name="soHopDong"
                    type="text"
                    required
                    placeholder="VD: HD-2024-001"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
            </div>

            <div>
                <label htmlFor="nguoiThucHienId" className="block text-sm font-medium text-slate-300 mb-2">
                    Người thực hiện
                </label>
                <select
                    id="nguoiThucHienId"
                    name="nguoiThucHienId"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                    <option value="">-- Chọn người thực hiện --</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.hoTen}
                        </option>
                    ))}
                </select>
                <p className="text-sm text-slate-500 mt-1">
                    Người thực hiện sẽ được giao để hoàn thiện thông tin hợp đồng
                </p>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Đang tạo..." : "Tạo hợp đồng"}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                    Hủy
                </button>
            </div>
        </form>
    );
}
