import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy danh sách hợp đồng
export async function GET() {
    try {
        const contracts = await prisma.hopDong.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                nguoiGiao: { select: { hoTen: true } },
                nguoiThucHien: { select: { hoTen: true } },
            },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Error fetching contracts:", error);
        return NextResponse.json(
            { message: "Lỗi khi lấy danh sách hợp đồng" },
            { status: 500 }
        );
    }
}

// POST - Tạo hợp đồng mới
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Chỉ User1 và Admin mới được tạo HĐ
        if (session.user.role !== "USER1" && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo mới có thể tạo hợp đồng" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { soHopDong, soHopDongKhung, nguoiThucHienId, isFrameworkContract, isConstructionInvestment } = body;

        // Validate: không thể cùng true
        if (isFrameworkContract && isConstructionInvestment) {
            return NextResponse.json(
                { message: "Không thể chọn đồng thời Hợp đồng khung và Công trình ĐTXD" },
                { status: 400 }
            );
        }

        // Validate số hợp đồng theo loại
        if (isFrameworkContract) {
            if (!soHopDongKhung) {
                return NextResponse.json(
                    { message: "Số hợp đồng khung là bắt buộc" },
                    { status: 400 }
                );
            }
            // Kiểm tra số HĐ khung đã tồn tại
            const existingKhung = await prisma.hopDong.findUnique({
                where: { soHopDongKhung },
            });
            if (existingKhung) {
                return NextResponse.json(
                    { message: "Số hợp đồng khung đã tồn tại" },
                    { status: 400 }
                );
            }
        } else {
            if (!soHopDong) {
                return NextResponse.json(
                    { message: "Số hợp đồng là bắt buộc" },
                    { status: 400 }
                );
            }
            // Kiểm tra số HĐ đã tồn tại
            const existing = await prisma.hopDong.findUnique({
                where: { soHopDong },
            });
            if (existing) {
                return NextResponse.json(
                    { message: "Số hợp đồng đã tồn tại" },
                    { status: 400 }
                );
            }
        }

        // Tạo số HĐ unique nếu là HĐ khung (vì soHopDong vẫn bắt buộc unique trong DB)
        const finalSoHopDong = isFrameworkContract
            ? `HDK-${Date.now()}` // Tạo mã tạm unique
            : soHopDong;

        const contract = await prisma.hopDong.create({
            data: {
                soHopDong: finalSoHopDong,
                soHopDongKhung: isFrameworkContract ? soHopDongKhung : null,
                nguoiGiaoId: session.user.id,
                nguoiThucHienId: nguoiThucHienId || null,
                isFrameworkContract: isFrameworkContract || false,
                isConstructionInvestment: isConstructionInvestment || false,
            },
        });

        // Gửi thông báo cho nhân viên được giao HĐ (fire and forget)
        if (nguoiThucHienId) {
            const { createNotification } = await import("@/lib/notifications");
            const leaderName = session.user.name || "Lãnh đạo";

            createNotification({
                userId: nguoiThucHienId,
                title: "Bạn được giao hợp đồng mới",
                message: `${leaderName} đã giao cho bạn hợp đồng ${finalSoHopDong}`,
                type: "contract_assigned",
                link: `/hop-dong/${contract.id}`,
            }).catch(console.error);
        }

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error("Error creating contract:", error);
        return NextResponse.json(
            { message: "Lỗi khi tạo hợp đồng" },
            { status: 500 }
        );
    }
}
