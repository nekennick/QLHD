"use client";

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
    buttonLabel?: string;
    onClose: () => void;
}

export default function AlertDialog({
    isOpen,
    title,
    message,
    type = "info",
    buttonLabel = "Đóng",
    onClose,
}: AlertDialogProps) {
    if (!isOpen) return null;

    const iconByType = {
        success: (
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
        ),
        error: (
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        ),
        info: (
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

    const buttonClass = {
        success: "bg-green-600 dark:bg-gradient-to-r dark:from-green-600 dark:to-emerald-600 hover:bg-green-700 dark:hover:from-green-700 dark:hover:to-emerald-700 border border-green-700 dark:border-transparent",
        error: "bg-red-600 dark:bg-gradient-to-r dark:from-red-600 dark:to-rose-600 hover:bg-red-700 dark:hover:from-red-700 dark:hover:to-rose-700 border border-red-700 dark:border-transparent",
        info: "bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 border border-slate-950 dark:border-transparent",
        warning: "bg-orange-600 dark:bg-gradient-to-r dark:from-orange-600 dark:to-amber-600 hover:bg-orange-700 dark:hover:from-orange-700 dark:hover:to-amber-700 border border-orange-700 dark:border-transparent",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Dialog */}
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    {iconByType[type]}

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                        {message}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className={`w-full px-4 py-2 ${buttonClass[type]} text-white rounded-lg transition-all`}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}
