"use client";

interface AssignmentConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    fromLabel?: string;
    currentExecutor: string;
    toLabel?: string;
    newExecutor: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function AssignmentConfirmDialog({
    isOpen,
    title = "Xác nhận chuyển giao hợp đồng",
    fromLabel = "Từ:",
    currentExecutor,
    toLabel = "Đến:",
    newExecutor,
    description = "Bạn có chắc chắn muốn chuyển giao hợp đồng này không?",
    onConfirm,
    onCancel,
}: AssignmentConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            ></div>

            {/* Dialog */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-semibold text-white mb-4">
                    {title}
                </h3>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-12">{fromLabel}</span>
                        <span className="text-white font-medium">{currentExecutor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-purple-400 text-xl ml-12">↓</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-12">{toLabel}</span>
                        <span className="text-white font-medium">{newExecutor}</span>
                    </div>
                </div>

                <p className="text-slate-400 text-sm mb-6">
                    {description}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}
