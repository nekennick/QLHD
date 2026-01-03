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

        const role = session.user.role;

        // Kiểm tra quyền dựa trên role
        // USER2 chỉ được sửa HĐ được giao cho mình
        if (role === "USER2" && existing.nguoiThucHienId !== session.user.id) {
            return NextResponse.json(
                { message: "Bạn không có quyền sửa hợp đồng này" },
                { status: 403 }
            );
        }

        // USER2_TCKT chỉ được sửa HĐ được giao thanh toán cho mình
        if (role === "USER2_TCKT" && existing.nguoiThanhToanId !== session.user.id) {
            return NextResponse.json(
                { message: "Bạn không có quyền sửa hợp đồng này" },
                { status: 403 }
            );
        }

        // Parse dates từ string
        const updateData: Record<string, unknown> = {};

        // Các trường text/number (phân quyền chi tiết)
        if (["USER1", "USER2", "ADMIN"].includes(role)) {
            // USER1 sau khi tạo xong chỉ có quyền điều chuyển người thực hiện (nguoiThucHienId)
            // USER2 và ADMIN có toàn quyền các trường này
            const isUser1 = role === "USER1";

            if (!isUser1) {
                if (body.tenHopDong !== undefined) updateData.tenHopDong = body.tenHopDong;
                if (body.giaTriHopDong !== undefined) updateData.giaTriHopDong = body.giaTriHopDong ? parseFloat(body.giaTriHopDong) : null;
                if (body.giaTriGiaoNhan !== undefined) updateData.giaTriGiaoNhan = body.giaTriGiaoNhan ? parseFloat(body.giaTriGiaoNhan) : null;
                if (body.giaTriNghiemThu !== undefined) updateData.giaTriNghiemThu = body.giaTriNghiemThu ? parseFloat(body.giaTriNghiemThu) : null;
                if (body.tuChinhHopDong !== undefined) updateData.tuChinhHopDong = body.tuChinhHopDong;

                // Các trường date (không bao gồm ngayQuyetToan - sẽ được xử lý riêng cho TCKT)
                const dateFields = ['ngayKy', 'ngayHieuLuc', 'hieuLucBaoDam', 'ngayGiaoHang', 'ngayDuyetThanhToan', 'hanBaoHanh'];
                for (const field of dateFields) {
                    if (body[field] !== undefined) {
                        updateData[field] = body[field] ? new Date(body[field]) : null;
                    }
                }
            }

            // nguoiThucHienId: USER1 (Lãnh đạo) luôn được sửa để điều chuyển việc
            if (body.nguoiThucHienId !== undefined) updateData.nguoiThucHienId = body.nguoiThucHienId || null;
        }

        // Trường quyết toán công trình đầu tư xây dựng: chỉ dành cho nhân viên TCKT được gán hoặc ADMIN
        const isTCKTAssigned = role === "USER2_TCKT" && existing.nguoiThanhToanId === session.user.id;
        const canEditSettlement = role === "ADMIN" || isTCKTAssigned;

        if (canEditSettlement) {
            if (body.giaTriQuyetToan !== undefined) updateData.giaTriQuyetToan = body.giaTriQuyetToan ? parseFloat(body.giaTriQuyetToan) : null;
            if (body.ngayQuyetToan !== undefined) updateData.ngayQuyetToan = body.ngayQuyetToan ? new Date(body.ngayQuyetToan) : null;
        }

        // USER1_TCKT được giao việc thanh toán (set nguoiThanhToanId)
        if (["USER1_TCKT", "ADMIN"].includes(role)) {
            if (body.nguoiThanhToanId !== undefined) {
                updateData.nguoiThanhToanId = body.nguoiThanhToanId || null;
            }
        }

        // USER2_TCKT được đánh dấu đã thanh toán
        if (["USER2_TCKT", "ADMIN"].includes(role)) {
            if (body.daThanhToan !== undefined) {
                updateData.daThanhToan = body.daThanhToan;
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
