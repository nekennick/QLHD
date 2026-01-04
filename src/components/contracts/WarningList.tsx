"use client";

import Link from "next/link";
import DeleteContractButton from "./DeleteContractButton";

interface WarningItem {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    hieuLucBaoDam?: string | null;
    hanBaoHanh?: string | null;
}

interface WarningGroup {
    title: string;
    items: WarningItem[];
    color: string;
    bgColor: string;
    icon: string;
    description?: string;
    showDelete?: boolean;
}

interface WarningListProps {
    groups: WarningGroup[];
    userRole?: string;
}

export default function WarningList({ groups, userRole }: WarningListProps) {
    const canDelete = userRole === "USER1" || userRole === "ADMIN";

    if (groups.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 px-2 uppercase tracking-wider text-red-500">
                <span className="animate-pulse">⚠️</span> Lưu ý quan trọng
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {groups.map((group, idx) => (
                    <div key={idx} className={`${group.bgColor} border border-white/5 rounded-xl overflow-hidden`}>
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span>{group.icon}</span>
                                    <h3 className={`font-semibold ${group.color}`}>{group.title}</h3>
                                </div>
                                {group.description && (
                                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 ml-6 italic">
                                        {group.description}
                                    </p>
                                )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold ${group.color}`}>
                                {group.items.length}
                            </span>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                            {group.items.map((item) => (
                                <div key={item.id} className="flex items-center px-4 py-3 hover:bg-white/5 transition-colors group">
                                    <Link
                                        href={`/hop-dong/${item.id}`}
                                        className="flex-1 flex items-center justify-between"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-200 group-hover:text-purple-400 transition-colors">
                                                {item.soHopDong}
                                            </span>
                                            <span
                                                className="text-xs text-slate-500 line-clamp-1 max-w-[250px] md:max-w-md"
                                                title={item.tenHopDong || undefined}
                                            >
                                                {item.tenHopDong || "(Chưa có tên)"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {item.hieuLucBaoDam && (
                                                <span className="text-[10px] text-orange-500 font-mono">
                                                    Hết hạn ĐB: {new Date(item.hieuLucBaoDam).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                            {item.hanBaoHanh && (
                                                <span className="text-[10px] text-green-500 font-mono">
                                                    Hết BH: {new Date(item.hanBaoHanh).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2 ml-3">
                                        {group.showDelete && canDelete && (
                                            <DeleteContractButton
                                                contractId={item.id}
                                                contractNumber={item.soHopDong}
                                            />
                                        )}
                                        <Link
                                            href={`/hop-dong/${item.id}`}
                                            className="text-slate-600 group-hover:text-purple-400"
                                        >
                                            →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
