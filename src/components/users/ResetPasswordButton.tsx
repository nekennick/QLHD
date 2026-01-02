"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AlertDialog from "@/components/ui/AlertDialog";

interface ResetPasswordButtonProps {
    userId: string;
    userName: string;
    targetRole: string;
}

export default function ResetPasswordButton({ userId, userName, targetRole }: ResetPasswordButtonProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error";
    }>({ isOpen: false, title: "", message: "", type: "success" });

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

    const handleResetClick = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmReset = async () => {
        setIsConfirmOpen(false);
        setLoading(true);

        try {
            const res = await fetch(`/api/users/${userId}/reset-password`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Thất bại");

            setAlertState({
                isOpen: true,
                title: "Thành công",
                message: `Đã khôi phục mật khẩu cho "${userName}" thành công! Mật khẩu mới là: 123456`,
                type: "success",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            setAlertState({
                isOpen: true,
                title: "Lỗi",
                message: "Có lỗi xảy ra khi khôi phục mật khẩu.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReset = () => {
        setIsConfirmOpen(false);
    };

    const handleCloseAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <>
            <button
                onClick={handleResetClick}
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

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Khôi phục mật khẩu"
                description={`Bạn có chắc muốn khôi phục mật khẩu cho "${userName}" về mặc định (123456)?`}
                confirmLabel="Khôi phục"
                cancelLabel="Hủy"
                variant="warning"
                onConfirm={handleConfirmReset}
                onCancel={handleCancelReset}
            />

            <AlertDialog
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={handleCloseAlert}
            />
        </>
    );
}
