"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DeleteContractButtonProps {
    contractId: string;
    contractNumber: string;
    onDeleted?: () => void;
}

export default function DeleteContractButton({
    contractId,
    contractNumber,
    onDeleted,
}: DeleteContractButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/hop-dong/${contractId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Không thể xóa hợp đồng");
            }

            setShowConfirm(false);
            if (onDeleted) {
                onDeleted();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting contract:", error);
            alert(error instanceof Error ? error.message : "Lỗi khi xóa hợp đồng");
        }
    };

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirm(true);
                }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="Xóa hợp đồng"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Xác nhận xóa hợp đồng"
                description={`Bạn có chắc chắn muốn xóa hợp đồng "${contractNumber}"? Thao tác này không thể hoàn tác.`}
                confirmLabel="Xóa"
                cancelLabel="Hủy"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
