"use client";

import { useSession, signOut } from "next-auth/react";
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

            if (formData.newPassword) {
                await signOut({ callbackUrl: "/login" });
                return;
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Cập nhật thông tin hiển thị và bảo mật</p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
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
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Tên hiển thị
                        </label>
                        <input
                            type="text"
                            value={formData.hoTen}
                            onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            required
                        />
                    </div>

                    <hr className="border-slate-200 dark:border-slate-700/50" />

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Đổi mật khẩu mới (Để trống nếu không đổi)
                        </label>
                        <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="Mật khẩu mới..."
                        />
                    </div>

                    {formData.newPassword && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white font-semibold rounded-lg shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Passkey Management */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Passkey (Sinh trắc học)
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Đăng ký Passkey để đăng nhập bằng vân tay, Face ID, hoặc Windows Hello mà không cần mật khẩu.
                </p>
                <button
                    type="button"
                    onClick={async () => {
                        try {
                            const { signIn } = await import("next-auth/webauthn");
                            await signIn("passkey", { action: "register" });
                        } catch (err) {
                            alert("Có lỗi xảy ra khi đăng ký Passkey: " + (err instanceof Error ? err.message : "Unknown error"));
                        }
                    }}
                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Đăng ký Passkey mới
                </button>
                <p className="text-slate-500 text-xs mt-3 text-center">
                    * Yêu cầu thiết bị hỗ trợ sinh trắc học hoặc Security Key
                </p>
            </div>
        </div>
    );
}
