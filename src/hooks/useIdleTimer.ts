import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
    idleTime: number;        // Thời gian idle (ms)
    warningTime?: number;    // Thời gian cảnh báo trước khi logout (ms)
    onIdle: () => void;      // Callback khi hết thời gian
    onWarning?: () => void;  // Callback cảnh báo
    onActivity?: () => void; // Callback khi có hoạt động (để reset warning)
}

export function useIdleTimer({
    idleTime,
    warningTime = 60000, // Default 1 phút
    onIdle,
    onWarning,
    onActivity,
}: UseIdleTimerOptions) {
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isWarningShownRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
    }, []);

    const resetTimer = useCallback(() => {
        clearTimers();

        // Nếu đang hiển thị warning, gọi onActivity để đóng dialog
        if (isWarningShownRef.current && onActivity) {
            isWarningShownRef.current = false;
            onActivity();
        }

        // Set warning timer (nếu có)
        if (onWarning && warningTime > 0) {
            const timeUntilWarning = idleTime - warningTime;
            if (timeUntilWarning > 0) {
                warningTimerRef.current = setTimeout(() => {
                    isWarningShownRef.current = true;
                    onWarning();
                }, timeUntilWarning);
            }
        }

        // Set idle timer
        idleTimerRef.current = setTimeout(() => {
            onIdle();
        }, idleTime);
    }, [idleTime, warningTime, onIdle, onWarning, onActivity, clearTimers]);

    useEffect(() => {
        // Các sự kiện cần theo dõi
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

        // Throttle để tránh gọi resetTimer quá nhiều lần
        let throttleTimeout: NodeJS.Timeout | null = null;
        const throttledResetTimer = () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    resetTimer();
                    throttleTimeout = null;
                }, 1000); // Throttle 1 giây
            }
        };

        // Đăng ký event listeners
        events.forEach((event) => {
            window.addEventListener(event, throttledResetTimer);
        });

        // Khởi tạo timer lần đầu
        resetTimer();

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, throttledResetTimer);
            });
            clearTimers();
            if (throttleTimeout) {
                clearTimeout(throttleTimeout);
            }
        };
    }, [resetTimer, clearTimers]);

    return { resetTimer };
}
