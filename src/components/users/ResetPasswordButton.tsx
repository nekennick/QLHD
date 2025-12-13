"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";



interface ResetPasswordButtonProps {
    userId: string;
    userName: string;
    targetRole: string;
}

export default function ResetPasswordButton({ userId, userName, targetRole }: ResetPasswordButtonProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Check permission logic on client side for UI hiding
    const canReset = () => {
        if (!session?.user) return false;
        if (session.user.role === "ADMIN") return true;

        // USER1 only resets USER2
        if (session.user.role === "USER1") {
            return targetRole === "USER2";
        }

        return false;
    };

    if (!canReset()) return null;

    const handleReset = async () => {
        if (!confirm(`Bạn có chắc muốn khôi phục mật khẩu cho user "${userName}" về mặc định (123456)?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/reset-password`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Thất bại");

            alert(`Đã khôi phục mật khẩu cho "${userName}" thành công! Mật khẩu mới là: 123456`);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi khôi phục mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={loading}
            title="Khôi phục mật khẩu"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            )}
        </button>
    );
}
