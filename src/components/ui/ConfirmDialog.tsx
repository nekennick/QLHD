"use client";

import { useState } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "info" | "warning";
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    variant = "info",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    const confirmButtonClass = {
        danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700",
        info: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
        warning: "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700",
    };

    const iconByVariant = {
        danger: (
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
        ),
        info: (
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        ),
        warning: (
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        ),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            ></div>

            {/* Dialog */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    {iconByVariant[variant]}

                    <h3 className="text-lg font-semibold text-white mb-2">
                        {title}
                    </h3>

                    {description && (
                        <p className="text-slate-400 text-sm mb-6">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 ${confirmButtonClass[variant]} text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
