"use client";

import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(onClose, 300);
    };

    const isError = type === "error";

    return (
        <div
            className={`max-w-md transition-all duration-300 ease-out ${
                isVisible && !isLeaving
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
            }`}
        >
            <div
                className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
                    isError
                        ? "bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-500/50 text-red-800 dark:text-red-200"
                        : "bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200"
                }`}
            >
                <span className="text-xl mt-0.5 flex-shrink-0">
                    {isError ? "❌" : "✅"}
                </span>
                <p className="text-sm font-medium flex-1 leading-relaxed">{message}</p>
                <button
                    onClick={handleClose}
                    className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                        isError
                            ? "hover:bg-red-200 dark:hover:bg-red-800 text-red-500 dark:text-red-400"
                            : "hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-500 dark:text-emerald-400"
                    }`}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
