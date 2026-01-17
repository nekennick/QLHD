import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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
            // USER1 sau khi tạo xong chỉ có quyền:
            // 1. Điều chuyển người thực hiện (nguoiThucHienId)
            // 2. Sửa Tên HĐ và Ngày ký (2 trường quản lý)
            // USER2 và ADMIN có toàn quyền các trường này
            const isUser1 = role === "USER1";

            // Các trường mà USER1 (Lãnh đạo) ĐƯỢC sửa
            if (body.tenHopDong !== undefined) updateData.tenHopDong = body.tenHopDong;
            if (body.ngayKy !== undefined) updateData.ngayKy = body.ngayKy ? new Date(body.ngayKy) : null;

            // Các trường mà chỉ USER2 và ADMIN được sửa
            if (!isUser1) {
                if (body.giaTriHopDong !== undefined) updateData.giaTriHopDong = body.giaTriHopDong ? parseFloat(body.giaTriHopDong) : null;
                if (body.giaTriGiaoNhan !== undefined) updateData.giaTriGiaoNhan = body.giaTriGiaoNhan ? parseFloat(body.giaTriGiaoNhan) : null;
                if (body.giaTriNghiemThu !== undefined) updateData.giaTriNghiemThu = body.giaTriNghiemThu ? parseFloat(body.giaTriNghiemThu) : null;
                if (body.tuChinhHopDong !== undefined) updateData.tuChinhHopDong = body.tuChinhHopDong;

                // Các trường date còn lại (không bao gồm ngayKy đã xử lý ở trên)
                const dateFields = ['ngayHieuLuc', 'hieuLucBaoDam', 'ngayGiaoHang', 'ngayDuyetThanhToan', 'hanBaoHanh'];
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

        // USER2_TCKT được cập nhật giá trị thanh toán (tích lũy) và quyết toán
        if (["USER2_TCKT", "ADMIN"].includes(role)) {
            // Cập nhật giá trị thanh toán (có thể cập nhật nhiều lần)
            if (body.giaTriThanhToan !== undefined) {
                updateData.giaTriThanhToan = body.giaTriThanhToan ? parseFloat(body.giaTriThanhToan) : null;
            }
            // Cập nhật giá trị quyết toán
            if (body.giaTriQuyetToan !== undefined) {
                updateData.giaTriQuyetToan = body.giaTriQuyetToan ? parseFloat(body.giaTriQuyetToan) : null;
            }
            // Xác nhận kết thúc (khóa HĐ)
            if (body.daQuyetToan === true) {
                updateData.daQuyetToan = true;
                updateData.ngayQuyetToanHoanTat = new Date();
            }
        }

        const contract = await prisma.hopDong.update({
            where: { id },
            data: updateData,
        });

        // ========================================
        // Tạo notification cho lãnh đạo khi nhân viên cập nhật HĐ
        // ========================================
        if (role === "USER2" || role === "USER2_TCKT") {
            // Tìm tất cả lãnh đạo tương ứng để gửi thông báo
            const leaderRoles = role === "USER2" ? ["USER1", "ADMIN"] : ["USER1_TCKT", "ADMIN"];
            const leaders = await prisma.user.findMany({
                where: { role: { in: leaderRoles } },
                select: { id: true },
            });

            // Lấy tên người cập nhật từ database
            const updater = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { hoTen: true, username: true },
            });
            const updaterName = updater?.hoTen || updater?.username || "Nhân viên";
            const contractName = contract.tenHopDong || contract.soHopDong;

            // Tạo thông báo cho từng lãnh đạo (fire and forget)
            Promise.all(
                leaders.map((leader) =>
                    createNotification({
                        userId: leader.id,
                        title: "Hợp đồng được cập nhật",
                        message: `${updaterName} đã cập nhật hợp đồng: ${contractName}`,
                        type: "contract_updated",
                        link: `/hop-dong/${contract.id}`,
                    }).catch(() => { }) // Ignore errors
                )
            );
        }

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
        const role = session?.user?.role;
        if (!session?.user || !["USER1", "ADMIN"].includes(role || "")) {
            return NextResponse.json(
                { message: "Chỉ lãnh đạo hoặc admin mới có thể xóa hợp đồng" },
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
