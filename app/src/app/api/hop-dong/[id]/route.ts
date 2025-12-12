import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Lấy chi tiết HĐ
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contract = await prisma.hopDong.findUnique({
            where: { id },
            include: {
                nguoiGiao: { select: { id: true, hoTen: true } },
                nguoiThucHien: { select: { id: true, hoTen: true } },
            },
        });

        if (!contract) {
            return NextResponse.json(
                { message: "Không tìm thấy hợp đồng" },
                { status: 404 }
            );
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error fetching contract:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}

// PUT - Cập nhật HĐ
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Lấy HĐ hiện tại để kiểm tra quyền
        const existing = await prisma.hopDong.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { message: "Không tìm thấy hợp đồng" },
                { status: 404 }
            );
        }

        // User2 chỉ được sửa HĐ được giao cho mình
        if (
            session.user.role === "USER2" &&
            existing.nguoiThucHienId !== session.user.id
        ) {
            return NextResponse.json(
                { message: "Bạn không có quyền sửa hợp đồng này" },
                { status: 403 }
            );
        }

        // Parse dates từ string
        const updateData: Record<string, unknown> = {};

        // Các trường text/number
        if (body.tenHopDong !== undefined) updateData.tenHopDong = body.tenHopDong;
        if (body.giaTriHopDong !== undefined) updateData.giaTriHopDong = body.giaTriHopDong ? parseFloat(body.giaTriHopDong) : null;
        if (body.giaTriGiaoNhan !== undefined) updateData.giaTriGiaoNhan = body.giaTriGiaoNhan ? parseFloat(body.giaTriGiaoNhan) : null;
        if (body.giaTriNghiemThu !== undefined) updateData.giaTriNghiemThu = body.giaTriNghiemThu ? parseFloat(body.giaTriNghiemThu) : null;
        if (body.tuChinhHopDong !== undefined) updateData.tuChinhHopDong = body.tuChinhHopDong;
        if (body.nguoiThucHienId !== undefined) updateData.nguoiThucHienId = body.nguoiThucHienId || null;

        // Các trường date
        const dateFields = ['ngayKy', 'ngayHieuLuc', 'hieuLucBaoDam', 'ngayGiaoHang', 'ngayDuyetThanhToan', 'hanBaoHanh'];
        for (const field of dateFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field] ? new Date(body[field]) : null;
            }
        }

        const contract = await prisma.hopDong.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error updating contract:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}

// DELETE - Xóa HĐ
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "USER1") {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo mới có thể xóa hợp đồng" },
                { status: 403 }
            );
        }

        const { id } = await params;
        await prisma.hopDong.delete({ where: { id } });

        return NextResponse.json({ message: "Đã xóa hợp đồng" });
    } catch (error) {
        console.error("Error deleting contract:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
