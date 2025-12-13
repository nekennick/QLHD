"use client";

import { useState } from "react";
import SidebarContent from "./SidebarContent";

export default function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-slate-400 hover:text-white focus:outline-none"
                    aria-label="Open sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="ml-4 font-bold text-white text-lg">QLHĐ</span>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <SidebarContent onLinkClick={() => setIsOpen(false)} />
            </div>
        </div>
    );
}
