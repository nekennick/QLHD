"use client";

import Link from "next/link";
import DeleteContractButton from "./DeleteContractButton";

interface WarningItem {
    id: string;
    soHopDong: string;
    tenHopDong: string | null;
    hieuLucBaoDam?: string | null;
    hanBaoHanh?: string | null;
    giaTriHopDong?: number | null;
    nguoiThucHien?: { hoTen: string } | null;
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

const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function WarningList({ groups, userRole }: WarningListProps) {
    const canDelete = userRole === "USER1" || userRole === "ADMIN";

    if (groups.length === 0) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-white/10 pb-3">
                <span className="text-2xl animate-pulse">⚠️</span>
                <span>Lưu ý quan trọng</span>
            </h2>

            <div className="flex flex-col gap-6">
                {groups.map((group, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{group.icon}</span>
                                    <h3 className={`font-bold text-base ${group.color}`}>
                                        {group.title}
                                    </h3>
                                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 border border-slate-600 ${group.color}`}>
                                        {group.items.length}
                                    </span>
                                </div>
                                {group.description && (
                                    <p className="text-xs text-slate-400 pl-8 italic">
                                        {group.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Table Layout */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold tracking-wide">
                                    <tr>
                                        <th className="px-4 py-3 w-[25%]">Người thực hiện</th>
                                        <th className="px-4 py-3 w-[20%]">Số hợp đồng</th>
                                        <th className="px-4 py-3 w-[15%] text-right">Giá trị</th>
                                        <th className="px-4 py-3 w-[40%]">Tên hợp đồng</th>
                                        <th className="px-2 py-3 w-[40px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50 bg-slate-800">
                                    {group.items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-700/40 transition-colors group"
                                        >
                                            <td className="px-4 py-2.5 text-slate-300 font-medium text-xs md:text-sm">
                                                <div className="truncate" title={item.nguoiThucHien?.hoTen}>
                                                    {item.nguoiThucHien?.hoTen || "—"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-300 font-mono text-xs md:text-sm whitespace-nowrap">
                                                <Link
                                                    href={`/hop-dong/${item.id}`}
                                                    className="hover:text-purple-400 transition-colors border-b border-transparent hover:border-purple-400/50 pb-0.5"
                                                >
                                                    {item.soHopDong}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-slate-300 font-mono text-xs md:text-sm whitespace-nowrap">
                                                {formatCurrency(item.giaTriHopDong)}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-400">
                                                <div className="flex flex-col">
                                                    <span
                                                        className="text-slate-300 font-medium group-hover:text-purple-300 transition-colors block"
                                                        title={item.tenHopDong || undefined}
                                                    >
                                                        {item.tenHopDong || "(Chưa có tên)"}
                                                    </span>

                                                    {/* Tags */}
                                                    {(item.hieuLucBaoDam || item.hanBaoHanh) && (
                                                        <div className="flex flex-wrap gap-2 mt-0.5">
                                                            {item.hieuLucBaoDam && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-orange-400">
                                                                    <span>⚠️</span>
                                                                    Hết hạn ĐB: {new Date(item.hieuLucBaoDam).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            )}
                                                            {item.hanBaoHanh && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                                                    <span>✅</span>
                                                                    Hết BH: {new Date(item.hanBaoHanh).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    {group.showDelete && canDelete && (
                                                        <DeleteContractButton
                                                            contractId={item.id}
                                                            contractNumber={item.soHopDong}
                                                        />
                                                    )}
                                                    <Link
                                                        href={`/hop-dong/${item.id}`}
                                                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        ➜
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
