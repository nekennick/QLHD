import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// Vercel Cron job - Kiểm tra nhân viên không hoạt động
// Chạy hàng ngày lúc 7:00 AM
export async function GET(request: NextRequest) {
    try {
        // Xác thực cron secret (bảo vệ endpoint)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Cho phép chạy local không cần secret
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        // Tìm nhân viên USER2 không đăng nhập trong 5 ngày VÀ đang có hợp đồng chưa hoàn thành
        const inactiveUsers = await prisma.user.findMany({
            where: {
                role: "USER2",
                OR: [
                    { lastLogin: null },
                    { lastLogin: { lt: fiveDaysAgo } },
                ],
                // Có ít nhất 1 hợp đồng chưa quyết toán
                hopDongThucHien: {
                    some: {
                        daQuyetToan: false,
                    },
                },
            },
            select: {
                id: true,
                hoTen: true,
                lastLogin: true,
                hopDongThucHien: {
                    where: { daQuyetToan: false },
                    select: { soHopDong: true, tenHopDong: true },
                    take: 5, // Chỉ lấy tối đa 5 hợp đồng để hiển thị
                },
            },
        });

        if (inactiveUsers.length === 0) {
            return NextResponse.json({
                message: "Không có nhân viên nào không hoạt động",
                checked: new Date().toISOString(),
            });
        }

        // Lấy danh sách lãnh đạo để gửi thông báo
        const leaders = await prisma.user.findMany({
            where: { role: { in: ["USER1", "ADMIN"] } },
            select: { id: true },
        });

        // Tạo thông báo cho từng lãnh đạo về từng nhân viên không hoạt động
        const notifications: Promise<unknown>[] = [];

        for (const user of inactiveUsers) {
            const lastLoginText = user.lastLogin
                ? `lần cuối đăng nhập ${new Date(user.lastLogin).toLocaleDateString("vi-VN")}`
                : "chưa từng đăng nhập";

            const contractCount = user.hopDongThucHien.length;
            const contractNames = user.hopDongThucHien
                .slice(0, 3)
                .map(c => c.soHopDong)
                .join(", ");

            const message = `${user.hoTen} ${lastLoginText}. Đang có ${contractCount} hợp đồng chưa hoàn thành (${contractNames}${contractCount > 3 ? "..." : ""})`;

            for (const leader of leaders) {
                notifications.push(
                    createNotification({
                        userId: leader.id,
                        title: "⚠️ Nhân viên không hoạt động",
                        message,
                        type: "contract_updated", // Sử dụng type có sẵn
                        link: "/nguoi-dung",
                    }).catch((err) => console.error("Notification error:", err))
                );
            }
        }

        await Promise.all(notifications);

        return NextResponse.json({
            message: "Đã gửi thông báo",
            inactiveUsers: inactiveUsers.map(u => ({
                hoTen: u.hoTen,
                lastLogin: u.lastLogin,
                contractCount: u.hopDongThucHien.length,
            })),
            notificationsSent: notifications.length,
            checked: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron check-inactive error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
