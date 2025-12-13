"use client";

import SidebarContent from "./SidebarContent";

export default function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col">
            <SidebarContent />
        </aside>
    );
}
