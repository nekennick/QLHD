"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AlertDialog from "@/components/ui/AlertDialog";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export default function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error";
    }>({ isOpen: false, title: "", message: "", type: "success" });

    const handleDeleteClick = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setIsConfirmOpen(false);

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                setAlertState({
                    isOpen: true,
                    title: "Không thể xóa",
                    message: data.message || "Có lỗi xảy ra khi xóa",
                    type: "error",
                });
                return;
            }

            setAlertState({
                isOpen: true,
                title: "Thành công",
                message: "Đã xóa người dùng thành công",
                type: "success",
            });
            router.refresh();
        } catch {
            setAlertState({
                isOpen: true,
                title: "Lỗi",
                message: "Có lỗi xảy ra, vui lòng thử lại",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmOpen(false);
    };

    const handleCloseAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <>
            <button
                onClick={handleDeleteClick}
                disabled={loading}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors ml-2"
                title="Xóa người dùng"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                )}
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={`Xóa người dùng "${userName}"?`}
                description="Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn. Hãy chắc chắn rằng nhân viên này không có hợp đồng nào đang thực hiện   "
                confirmLabel="Xóa"
                cancelLabel="Hủy"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
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
