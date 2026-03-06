"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast from "@/components/ui/Toast";

interface ToastMessage {
    id: number;
    message: string;
    type: "success" | "error";
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: "success" | "error", duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: "success" | "error", duration?: number) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Render toasts stacked from bottom */}
            <div className="fixed bottom-6 right-6 z-[9999] space-y-3 pointer-events-none">
                {toasts.map((toast, index) => (
                    <div key={toast.id} className="pointer-events-auto" style={{ zIndex: 9999 - index }}>
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                            duration={toast.duration ?? (toast.type === "error" ? 8000 : 4000)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
