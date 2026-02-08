"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

// ========================================
// Skeleton Loading Component
// ========================================
const NotificationSkeleton = () => (
    <div className="animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

// ========================================
// Single Notification Item Component
// ========================================
const NotificationItem = ({
    notification,
    onClick,
}: {
    notification: Notification;
    onClick: () => void;
}) => {
    const getIcon = (type: string) => {
        switch (type) {
            case "contract_assigned": return "📥";
            case "contract_released": return "📤";
            case "contract_updated": return "📝";
            case "payment_assigned": return "💰";
            default: return "🔔";
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${!notification.isRead ? "bg-slate-100 dark:bg-slate-700/30" : ""
                }`}
        >
            <div className="flex gap-3">
                <span className="text-xl">{getIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${notification.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                        }`}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                    </p>
                </div>
                {!notification.isRead && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                )}
            </div>
        </button>
    );
};

// ========================================
// Main Component
// ========================================
export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true); // Start with loading = true
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const hasFetched = useRef(false); // Track if we've fetched

    useEffect(() => {
        setMounted(true);
    }, []);

    // ========================================
    // Pre-fetch notifications on mount (KEY OPTIMIZATION)
    // ========================================
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications?limit=10");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch {
            // Ignore errors
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Pre-fetch immediately on mount
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchNotifications();
        }
    }, [fetchNotifications]);

    // Refresh every 60 seconds (instead of 30s for unread count only)
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            });
        }
    }, [isOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        // Optimistic update
        if (!notification.isRead) {
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Fire and forget - don't wait
            fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
        }

        // Navigate immediately
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Fire and forget
        fetch("/api/notifications/mark-all-read", { method: "POST" });
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            style={{
                top: `${coords.top + 8}px`,
                left: mounted && window.innerWidth < 768 ? '16px' : `${coords.left}px`,
                right: mounted && window.innerWidth < 768 ? '16px' : 'auto'
            }}
            className="fixed w-auto md:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[999] overflow-hidden animate-in fade-in zoom-in duration-150"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Thông báo</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                    <NotificationSkeleton />
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm">Không có thông báo</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClick={() => handleNotificationClick(notification)}
                        />
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Thông báo"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {mounted && isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
}
