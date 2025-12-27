"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter, redirect } from "next/navigation";

export default function CreateUserPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/login");
        },
    });

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isUser1 = session?.user?.role === "USER1";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            username: formData.get("username"),
            password: formData.get("password"),
            hoTen: formData.get("hoTen"),
            role: formData.get("role"),
        };

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Có lỗi xảy ra");
            }

            router.push("/nguoi-dung");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Thêm người dùng</h1>
                <p className="text-slate-400 mt-1">Tạo tài khoản người dùng mới</p>
            </div>

            {/* Form */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                            Tên đăng nhập <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            placeholder="VD: nhanvien3"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                            Mật khẩu <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Nhập mật khẩu"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="hoTen" className="block text-sm font-medium text-slate-300 mb-2">
                            Họ tên <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="hoTen"
                            name="hoTen"
                            type="text"
                            required
                            placeholder="VD: Nguyễn Văn A"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {!isUser1 && (
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                                Vai trò <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="USER2">Người thực hiện HĐ</option>
                                <option value="USER1">Lãnh đạo HĐ</option>
                                <option value="USER1_TCKT">Lãnh đạo TCKT</option>
                                <option value="USER2_TCKT">Nhân viên TCKT</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang tạo..." : "Tạo người dùng"}
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
            </div>
        </div>
    );
}
