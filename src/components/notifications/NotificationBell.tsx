"use client";

import { useState, useEffect, useRef } from "react";
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

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch unread count periodically
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await fetch("/api/notifications/unread-count");
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count || 0);
                }
            } catch {
                // Ignore errors
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Fetch notifications when dropdown opens and calculate position
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                });
            }
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch {
            // Ignore errors
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
        }

        // Navigate to link
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        await fetch("/api/notifications/mark-all-read", { method: "POST" });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "contract_assigned":
                return "📥";
            case "contract_released":
                return "📤";
            case "payment_assigned":
                return "💰";
            default:
                return "🔔";
        }
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            style={{
                top: `${coords.top + 8}px`,
                // On small screens, keep it within viewport, otherwise align to button
                left: mounted && window.innerWidth < 768 ? '16px' : `${coords.left}px`,
                right: mounted && window.innerWidth < 768 ? '16px' : 'auto'
            }}
            className="fixed w-auto md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[999] overflow-hidden animate-in fade-in zoom-in duration-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <h3 className="font-semibold text-white">Thông báo</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-purple-400 hover:text-purple-300"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin mx-auto" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm">Không có thông báo</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${!notification.isRead ? "bg-slate-700/30" : ""
                                }`}
                        >
                            <div className="flex gap-3">
                                <span className="text-xl">
                                    {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${notification.isRead ? "text-slate-300" : "text-white"
                                        }`}>
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formatTimeAgo(notification.createdAt)}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                                )}
                            </div>
                        </button>
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
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
