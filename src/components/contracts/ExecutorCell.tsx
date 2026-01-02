"use client";

import { useState, useEffect, useRef } from "react";
import AssignmentConfirmDialog from "./AssignmentConfirmDialog";
import AlertDialog from "@/components/ui/AlertDialog";

interface ExecutorCellProps {
    contractId: string;
    currentExecutor: {
        id: string;
        name: string;
    } | null;
    canReassign: boolean;
    onReassignSuccess?: () => void;
}

interface AssignableUser {
    id: string;
    hoTen: string;
    role: string;
}

export default function ExecutorCell({
    contractId,
    currentExecutor,
    canReassign,
    onReassignSuccess,
}: ExecutorCellProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AssignableUser | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error";
    }>({ isOpen: false, title: "", message: "", type: "error" });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isDropdownOpen]);

    // Fetch assignable users when dropdown opens
    useEffect(() => {
        if (isDropdownOpen && canReassign) {
            fetchAssignableUsers();
        }
    }, [isDropdownOpen, canReassign]);

    async function fetchAssignableUsers() {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/assignable?contractId=${contractId}`);
            if (res.ok) {
                const data = await res.json();
                setAssignableUsers(data.users || []);
            } else {
                const error = await res.json();
                setAlertState({
                    isOpen: true,
                    title: "Lỗi",
                    message: error.message || "Không thể tải danh sách nhân viên",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error fetching assignable users:", error);
            setAlertState({
                isOpen: true,
                title: "Lỗi",
                message: "Lỗi khi tải danh sách nhân viên",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    function handleUserSelect(user: AssignableUser) {
        setSelectedUser(user);
        setIsDropdownOpen(false);
        setIsConfirmOpen(true);
    }

    async function handleConfirmReassign() {
        if (!selectedUser) return;

        try {
            const res = await fetch(`/api/hop-dong/${contractId}/reassign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newExecutorId: selectedUser.id }),
            });

            if (res.ok) {
                setIsConfirmOpen(false);
                setSelectedUser(null);
                onReassignSuccess?.();
            } else {
                const error = await res.json();
                setAlertState({
                    isOpen: true,
                    title: "Lỗi",
                    message: error.message || "Không thể chuyển giao hợp đồng",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error reassigning contract:", error);
            setAlertState({
                isOpen: true,
                title: "Lỗi",
                message: "Lỗi khi chuyển giao hợp đồng",
                type: "error",
            });
        }
    }

    function handleCancelReassign() {
        setIsConfirmOpen(false);
        setSelectedUser(null);
    }

    if (!canReassign) {
        return <span className="text-slate-300">{currentExecutor?.name || "—"}</span>;
    }

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                    {currentExecutor?.name || "—"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[200px]">
                        {loading ? (
                            <div className="p-3 text-center text-slate-400 text-sm">
                                Đang tải...
                            </div>
                        ) : assignableUsers.length === 0 ? (
                            <div className="p-3 text-center text-slate-400 text-sm">
                                Không có nhân viên khả dụng
                            </div>
                        ) : (
                            <div className="py-1">
                                {assignableUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm transition-colors"
                                    >
                                        {user.hoTen}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AssignmentConfirmDialog
                isOpen={isConfirmOpen}
                currentExecutor={currentExecutor?.name || "—"}
                newExecutor={selectedUser?.hoTen || ""}
                onConfirm={handleConfirmReassign}
                onCancel={handleCancelReassign}
            />

            <AlertDialog
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
}
