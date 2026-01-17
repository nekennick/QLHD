"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import NotificationBell from "@/components/notifications/NotificationBell";
import PushManager from "@/components/notifications/PushManager";

const menuItems = [
    {
        name: "Dashboard",
        href: "/",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: "Hợp đồng",
        href: "/hop-dong",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: "Báo cáo",
        href: "/bao-cao",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        leaderOnly: true, // Chỉ hiển thị cho lãnh đạo (USER1, USER1_TCKT, ADMIN)
    },
    {
        name: "Người dùng",
        href: "/nguoi-dung",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        adminOnly: true,
    },
    {
        name: "Thanh toán",
        href: "/tckt",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        tcktOnly: true,
    },
];

interface SidebarContentProps {
    onLinkClick?: () => void;
}

export default function SidebarContent({ onLinkClick }: SidebarContentProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role || "";
    const isAdmin = ["USER1", "ADMIN"].includes(role);
    const isLeader = ["USER1", "USER1_TCKT", "ADMIN"].includes(role); // Lãnh đạo
    const isTCKT = ["USER1_TCKT", "USER2_TCKT", "ADMIN"].includes(role);
    const isUser2 = role === "USER2";
    const [pendingCount, setPendingCount] = useState(0);
    const [contractCount, setContractCount] = useState(0);

    // Fetch pending payment count for TCKT users
    useEffect(() => {
        if (!isTCKT) return;

        const fetchPendingCount = async () => {
            try {
                const res = await fetch("/api/tckt/pending-count");
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(data.count || 0);
                }
            } catch {
                // Ignore errors
            }
        };

        fetchPendingCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, [isTCKT]);

    // Fetch contract count for USER2
    useEffect(() => {
        if (!isUser2) return;

        const fetchContractCount = async () => {
            try {
                const res = await fetch("/api/hop-dong/pending-count");
                if (res.ok) {
                    const data = await res.json();
                    setContractCount(data.count || 0);
                }
            } catch {
                // Ignore errors
            }
        };

        fetchContractCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchContractCount, 30000);
        return () => clearInterval(interval);
    }, [isUser2]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-white">QLHĐ</h1>
                            <p className="text-xs text-slate-500">Quản lý hợp đồng</p>
                        </div>
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {/* Push Manager (hidden component) */}
            <PushManager />

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    if ((item as any).leaderOnly && !isLeader) return null;
                    if ((item as any).tcktOnly && !isTCKT) return null;

                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                            {/* Badge cho Hợp đồng (USER2) */}
                            {item.href === "/hop-dong" && isUser2 && contractCount > 0 && (
                                <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                                    {contractCount}
                                </span>
                            )}
                            {/* Badge cho Thanh toán (TCKT) */}
                            {item.href === "/tckt" && pendingCount > 0 && (
                                <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-slate-800">
                <Link
                    href="/thong-tin-ca-nhan"
                    className="flex items-center gap-3 mb-3 hover:bg-slate-800 p-2 rounded-lg transition-colors group"
                >
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                        <span className="text-sm font-medium text-white">
                            {session?.user?.name?.charAt(0) || "U"}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-slate-500">
                            {role === "USER1" ? "Lãnh đạo hợp đồng" :
                                role === "ADMIN" ? "Quản trị viên" :
                                    role === "USER1_TCKT" ? "Lãnh đạo TCKT" :
                                        role === "USER2_TCKT" ? "Nhân viên TCKT" : "Người thực hiện hợp đồng"}
                        </p>
                    </div>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
