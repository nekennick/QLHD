"use client";

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useIdleTimer } from '@/hooks/useIdleTimer';

const IDLE_TIME = 15 * 60 * 1000; // 15 phút
const WARNING_TIME = 60 * 1000;   // 1 phút

interface IdleTimerWrapperProps {
    children: React.ReactNode;
}

export default function IdleTimerWrapper({ children }: IdleTimerWrapperProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const handleIdle = useCallback(() => {
        // Tự động logout
        signOut({ callbackUrl: '/login' });
    }, []);

    const handleWarning = useCallback(() => {
        setShowWarning(true);
        setCountdown(60);
    }, []);

    const handleActivity = useCallback(() => {
        setShowWarning(false);
        setCountdown(60);
    }, []);

    const { resetTimer } = useIdleTimer({
        idleTime: IDLE_TIME,
        warningTime: WARNING_TIME,
        onIdle: handleIdle,
        onWarning: handleWarning,
        onActivity: handleActivity,
    });

    const handleContinue = useCallback(() => {
        setShowWarning(false);
        setCountdown(60);
        resetTimer();
    }, [resetTimer]);

    // Countdown timer cho warning dialog
    useEffect(() => {
        if (!showWarning) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showWarning]);

    return (
        <>
            {children}

            {/* Warning Dialog - Simple */}
            {showWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
                        <p className="text-white text-lg mb-6">
                            Bạn sẽ đăng xuất trong <span className="text-orange-400 font-bold text-2xl">{countdown}</span> giây
                        </p>
                        <button
                            onClick={handleContinue}
                            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
