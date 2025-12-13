"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        hoTen: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (session?.user?.name) {
            setFormData((prev) => ({ ...prev, hoTen: session.user.name || "" }));
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hoTen: formData.hoTen,
                    newPassword: formData.newPassword || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Có lỗi xảy ra");
            }

            setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });

            // Cập nhật session client-side
            await update({ name: formData.hoTen });

            // Reset password fields
            setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
            router.refresh();

        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Thông tin cá nhân</h1>
                <p className="text-slate-400 mt-1">Cập nhật thông tin hiển thị và bảo mật</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-lg ${message.type === "success"
                            ? "bg-green-500/10 border border-green-500/50 text-green-400"
                            : "bg-red-500/10 border border-red-500/50 text-red-400"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tên hiển thị
                        </label>
                        <input
                            type="text"
                            value={formData.hoTen}
                            onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            required
                        />
                    </div>

                    <hr className="border-slate-700/50" />

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Đổi mật khẩu mới (Để trống nếu không đổi)
                        </label>
                        <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="Mật khẩu mới..."
                        />
                    </div>

                    {formData.newPassword && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
