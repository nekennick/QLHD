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
        const { soHopDong, nguoiThucHienId, isConstructionInvestment } = body;

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

        const contract = await prisma.hopDong.create({
            data: {
                soHopDong,
                nguoiGiaoId: session.user.id,
                nguoiThucHienId: nguoiThucHienId || null,
                isConstructionInvestment: isConstructionInvestment || false,
            },
        });

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error("Error creating contract:", error);
        return NextResponse.json(
            { message: "Lỗi khi tạo hợp đồng" },
            { status: 500 }
        );
    }
}
