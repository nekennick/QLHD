import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ResetPasswordButton from "@/components/users/ResetPasswordButton";
import DeleteUserButton from "@/components/users/DeleteUserButton";

async function getUsers() {
    return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            hoTen: true,
            role: true,
            createdAt: true,
            _count: {
                select: {
                    hopDongThucHien: true,
                },
            },
        },
    });
}

export default async function UsersPage() {
    const session = await auth();

    // Tiêu đề thay đổi nếu là admin?
    // Chỉ User1 và Admin mới được xem
    if (session?.user?.role !== "USER1" && session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const users = await getUsers();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Người dùng</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Quản lý tài khoản người dùng</p>
                </div>
                <Link
                    href="/nguoi-dung/tao-moi"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 text-white rounded-lg hover:bg-slate-800 dark:hover:from-purple-700 dark:hover:to-pink-700 transition-all shadow-sm dark:shadow-lg dark:shadow-purple-500/25 border border-slate-950 dark:border-transparent"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm người dùng
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tổng người dùng</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u.role === "USER1").length}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Lãnh đạo</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u.role === "USER2").length}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Người thực hiện</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-6 py-4 font-medium">Tên đăng nhập</th>
                                <th className="px-6 py-4 font-medium">Họ tên</th>
                                <th className="px-6 py-4 font-medium">Vai trò</th>
                                <th className="px-6 py-4 font-medium">Số hợp đồng thực hiện</th>
                                <th className="px-6 py-4 font-medium">Ngày tạo</th>
                                <th className="px-6 py-4 font-medium text-right">Reset mật khẩu</th>
                                {(session?.user?.role === "ADMIN" || session?.user?.role === "USER1") && (
                                    <th className="px-6 py-4 font-medium text-right">Xóa</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-300">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.username}</td>
                                    <td className="px-6 py-4">{user.hoTen}</td>
                                    <td className="px-6 py-4">
                                        {user.role === "USER1" ? (
                                            <span className="px-2 py-0.5 text-xs bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
                                                Lãnh đạo hợp đồng
                                            </span>
                                        ) : user.role === "ADMIN" ? (
                                            <span className="px-2 py-0.5 text-xs bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">
                                                Quản trị viên
                                            </span>
                                        ) : user.role === "USER1_TCKT" ? (
                                            <span className="px-2 py-0.5 text-xs bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                                                Lãnh đạo TCKT
                                            </span>
                                        ) : user.role === "USER2_TCKT" ? (
                                            <span className="px-2 py-0.5 text-xs bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                Nhân viên TCKT
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                                                Người thực hiện hợp đồng
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{user._count.hopDongThucHien}</td>
                                    <td className="px-6 py-4">
                                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ResetPasswordButton
                                            userId={user.id}
                                            userName={user.hoTen}
                                            targetRole={user.role}
                                        />
                                    </td>
                                    {(session?.user?.role === "ADMIN" ||
                                        (session?.user?.role === "USER1" && user.role === "USER2")) && (
                                            <td className="px-6 py-4 text-right">
                                                <DeleteUserButton
                                                    userId={user.id}
                                                    userName={user.hoTen}
                                                />
                                            </td>
                                        )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-blue-600 dark:text-blue-400 font-medium mb-2">💡 Phân quyền</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• <strong>Lãnh đạo (User1)</strong>: Tạo hợp đồng, giao việc, xem tất cả báo cáo</li>
                    <li>• <strong>Người thực hiện (User2)</strong>: Nhập thông tin hợp đồng được giao, xem báo cáo cá nhân</li>
                    <li>• <strong>Admin</strong>: Toàn quyền quản trị hệ thống</li>
                </ul>
            </div>
        </div>
    );
}
