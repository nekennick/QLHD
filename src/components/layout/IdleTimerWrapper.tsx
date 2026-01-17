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

            {/* Warning Dialog */}
            {showWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-white text-center mb-2">
                            Phiên làm việc sắp hết hạn
                        </h3>

                        {/* Message */}
                        <p className="text-slate-400 text-center mb-6">
                            Bạn sẽ bị đăng xuất tự động sau <span className="text-orange-400 font-bold">{countdown} giây</span> do không có hoạt động.
                        </p>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 60) * 100}%` }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleContinue}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/20"
                            >
                                Tiếp tục làm việc
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
