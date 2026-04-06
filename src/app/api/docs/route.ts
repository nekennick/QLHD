import { NextResponse } from "next/server";

// PUBLIC endpoint — không cần auth
// AI LLM có thể đọc endpoint này để hiểu cấu trúc API
export async function GET() {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const spec = {
        openapi: "3.1.0",
        info: {
            title: "QLHĐ — Hệ thống Quản lý Hợp đồng",
            description: "API cho hệ thống quản lý hợp đồng nội bộ. Hỗ trợ quản lý vòng đời hợp đồng từ tạo mới → giao nhận → nghiệm thu → thanh toán → quyết toán → bảo hành → kết thúc.",
            version: "1.0.0",
            contact: {
                name: "QLHĐ Admin",
            },
        },
        servers: [{ url: baseUrl, description: "Server hiện tại" }],
        tags: [
            { name: "Hợp đồng", description: "CRUD và quản lý vòng đời hợp đồng" },
            { name: "Người dùng", description: "Quản lý tài khoản người dùng" },
            { name: "Tài chính kế toán", description: "Thanh toán và quyết toán" },
            { name: "Thông báo", description: "Hệ thống thông báo realtime" },
            { name: "Báo cáo", description: "Xuất báo cáo Word/Excel" },
        ],
        paths: {
            "/api/hop-dong": {
                get: {
                    tags: ["Hợp đồng"],
                    summary: "Lấy danh sách tất cả hợp đồng",
                    description: "Trả về mảng hợp đồng kèm thông tin người giao và người thực hiện. Sắp xếp theo ngày tạo mới nhất.",
                    responses: {
                        "200": {
                            description: "Danh sách hợp đồng",
                            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/HopDong" } } } },
                        },
                    },
                },
                post: {
                    tags: ["Hợp đồng"],
                    summary: "Tạo hợp đồng mới",
                    description: "Chỉ USER1 (Lãnh đạo) và ADMIN được tạo. Cần truyền soHopDong (unique) và tùy chọn giao cho người thực hiện.",
                    security: [{ session: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["soHopDong"],
                                    properties: {
                                        soHopDong: { type: "string", description: "Số hợp đồng (unique)", example: "HD-2026-001" },
                                        soHopDongKhung: { type: "string", description: "Số HĐ khung (nếu là HĐ khung)" },
                                        nguoiThucHienId: { type: "string", description: "ID nhân viên được giao thực hiện" },
                                        isFrameworkContract: { type: "boolean", default: false },
                                        isConstructionInvestment: { type: "boolean", default: false, description: "Là HĐ công trình ĐTXD" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Tạo thành công" },
                        "400": { description: "Số HĐ trùng hoặc thiếu thông tin" },
                        "401": { description: "Chưa đăng nhập" },
                        "403": { description: "Không đủ quyền" },
                    },
                },
            },
            "/api/hop-dong/{id}": {
                get: {
                    tags: ["Hợp đồng"],
                    summary: "Lấy chi tiết 1 hợp đồng",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        "200": { description: "Chi tiết hợp đồng", content: { "application/json": { schema: { $ref: "#/components/schemas/HopDong" } } } },
                        "404": { description: "Không tìm thấy" },
                    },
                },
                put: {
                    tags: ["Hợp đồng"],
                    summary: "Cập nhật hợp đồng",
                    description: "Phân quyền chi tiết: USER1 chỉ sửa tên HĐ + ngày ký + điều chuyển nhân viên. USER2 sửa toàn bộ thông tin nghiệp vụ. USER2_TCKT sửa phần thanh toán/quyết toán. ADMIN toàn quyền.",
                    security: [{ session: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/HopDongUpdate" },
                            },
                        },
                    },
                    responses: {
                        "200": { description: "Cập nhật thành công" },
                        "400": { description: "Validation lỗi (thanh toán vượt giá trị HĐ, v.v.)" },
                        "403": { description: "Không đủ quyền" },
                        "404": { description: "Không tìm thấy" },
                    },
                },
                delete: {
                    tags: ["Hợp đồng"],
                    summary: "Xóa hợp đồng",
                    description: "Chỉ xóa được HĐ chưa có tên hoặc ngày hiệu lực. USER1 + ADMIN mới được xóa.",
                    security: [{ session: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        "200": { description: "Đã xóa" },
                        "400": { description: "HĐ đã có dữ liệu, không xóa được" },
                        "403": { description: "Không đủ quyền" },
                    },
                },
            },
            "/api/hop-dong/{id}/reassign": {
                post: {
                    tags: ["Hợp đồng"],
                    summary: "Điều chuyển người thực hiện HĐ",
                    security: [{ session: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    requestBody: {
                        content: { "application/json": { schema: { type: "object", properties: { nguoiThucHienId: { type: "string" } } } } },
                    },
                    responses: { "200": { description: "Điều chuyển thành công" } },
                },
            },
            "/api/hop-dong/{id}/assign-tckt": {
                post: {
                    tags: ["Tài chính kế toán"],
                    summary: "Giao việc thanh toán cho nhân viên TCKT",
                    security: [{ session: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    requestBody: {
                        content: { "application/json": { schema: { type: "object", properties: { nguoiThanhToanId: { type: "string" } } } } },
                    },
                    responses: { "200": { description: "Giao việc thành công" } },
                },
            },
            "/api/users": {
                get: {
                    tags: ["Người dùng"],
                    summary: "Lấy danh sách người dùng",
                    description: "Chỉ USER1 và ADMIN được xem. Trả về id, username, hoTen, role.",
                    security: [{ session: [] }],
                    responses: { "200": { description: "Danh sách người dùng" } },
                },
                post: {
                    tags: ["Người dùng"],
                    summary: "Tạo tài khoản người dùng",
                    description: "USER1 tạo được USER2/USER2_TCKT. ADMIN tạo được mọi role.",
                    security: [{ session: [] }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["username", "password", "hoTen"],
                                    properties: {
                                        username: { type: "string" },
                                        password: { type: "string" },
                                        hoTen: { type: "string", description: "Họ tên đầy đủ" },
                                        role: { type: "string", enum: ["USER1", "USER2", "USER2_TCKT", "ADMIN"] },
                                    },
                                },
                            },
                        },
                    },
                    responses: { "201": { description: "Tạo thành công" } },
                },
            },
            "/api/notifications": {
                get: {
                    tags: ["Thông báo"],
                    summary: "Lấy danh sách thông báo của user đang đăng nhập",
                    security: [{ session: [] }],
                    responses: { "200": { description: "Danh sách thông báo" } },
                },
            },
            "/api/notifications/unread-count": {
                get: {
                    tags: ["Thông báo"],
                    summary: "Đếm số thông báo chưa đọc",
                    security: [{ session: [] }],
                    responses: { "200": { description: "{ count: number }" } },
                },
            },
            "/api/bao-cao/export": {
                get: {
                    tags: ["Báo cáo"],
                    summary: "Xuất báo cáo hợp đồng ra Word/Excel",
                    description: "Hỗ trợ lọc theo loại báo cáo, người thực hiện, trạng thái bảo hành/hoàn tất.",
                    security: [{ session: [] }],
                    parameters: [
                        { name: "type", in: "query", schema: { type: "string", enum: ["all", "incomplete", "delivering", "late", "upcoming", "slow_payment", "expiring", "accepted", "paid", "warranty", "settled", "completed"] } },
                        { name: "format", in: "query", schema: { type: "string", enum: ["word", "excel"] } },
                        { name: "nguoiThucHien", in: "query", schema: { type: "string" }, description: "Filter theo ID người thực hiện" },
                        { name: "isWarranty", in: "query", schema: { type: "boolean" }, description: "Chỉ lấy HĐ đang bảo hành" },
                        { name: "isCompleted", in: "query", schema: { type: "boolean" }, description: "Chỉ lấy HĐ đã hoàn tất" },
                    ],
                    responses: {
                        "200": { description: "File Word (.docx) hoặc Excel (.xlsx)" },
                    },
                },
            },
            "/api/tckt/cho-thanh-toan": {
                get: {
                    tags: ["Tài chính kế toán"],
                    summary: "Lấy danh sách HĐ chờ thanh toán",
                    security: [{ session: [] }],
                    responses: { "200": { description: "Danh sách HĐ cần thanh toán" } },
                },
            },
            "/api/tckt/nhan-vien": {
                get: {
                    tags: ["Tài chính kế toán"],
                    summary: "Lấy danh sách nhân viên TCKT",
                    security: [{ session: [] }],
                    responses: { "200": { description: "Danh sách nhân viên TCKT" } },
                },
            },
            "/api/me": {
                get: {
                    tags: ["Người dùng"],
                    summary: "Lấy thông tin user đang đăng nhập",
                    security: [{ session: [] }],
                    responses: { "200": { description: "Thông tin profile" } },
                },
            },
        },
        components: {
            schemas: {
                HopDong: {
                    type: "object",
                    description: "Hợp đồng — Entity chính của hệ thống",
                    properties: {
                        id: { type: "string", format: "cuid", description: "ID duy nhất" },
                        soHopDong: { type: "string", description: "Số hợp đồng (unique)" },
                        tenHopDong: { type: "string", nullable: true, description: "Tên hợp đồng" },
                        giaTriHopDong: { type: "number", nullable: true, description: "Giá trị hợp đồng (VNĐ)" },
                        ngayKy: { type: "string", format: "date-time", nullable: true, description: "Ngày ký HĐ" },
                        ngayHieuLuc: { type: "string", format: "date-time", nullable: true, description: "Ngày bắt đầu hiệu lực" },
                        hieuLucBaoDam: { type: "string", format: "date-time", nullable: true, description: "Thời hạn bảo đảm thực hiện HĐ" },
                        ngayGiaoHang: { type: "string", format: "date-time", nullable: true, description: "Ngày giao hàng kế hoạch" },
                        tuChinhHopDong: { type: "string", nullable: true, description: "Thông tin tu chỉnh" },
                        isFrameworkContract: { type: "boolean", description: "Là HĐ khung" },
                        soHopDongKhung: { type: "string", nullable: true, description: "Số HĐ khung" },
                        isConstructionInvestment: { type: "boolean", description: "Là HĐ công trình ĐTXD" },
                        giaTriGiaoNhan: { type: "number", nullable: true, description: "Giá trị hàng giao nhận (VNĐ)" },
                        giaTriNghiemThu: { type: "number", nullable: true, description: "Giá trị hàng nghiệm thu (VNĐ)" },
                        ngayDuyetThanhToan: { type: "string", format: "date-time", nullable: true, description: "Ngày duyệt tạm ứng/thanh toán" },
                        hanBaoHanh: { type: "string", format: "date-time", nullable: true, description: "Hạn bảo hành hàng hóa" },
                        giaTriThanhToan: { type: "number", nullable: true, description: "Tổng giá trị đã thanh toán (VNĐ)" },
                        giaTriQuyetToan: { type: "number", nullable: true, description: "Trị giá quyết toán công trình (VNĐ)" },
                        ngayQuyetToan: { type: "string", format: "date-time", nullable: true, description: "Ngày quyết toán" },
                        giaTriVatTuThuaDaXuLy: { type: "number", nullable: true, description: "Trị giá vật tư thừa đã xử lý (VNĐ)" },
                        daQuyetToan: { type: "boolean", description: "HĐ đã quyết toán xong (khóa)" },
                        nguoiGiaoId: { type: "string", description: "ID người giao (Lãnh đạo)" },
                        nguoiThucHienId: { type: "string", nullable: true, description: "ID người thực hiện" },
                        nguoiThanhToanId: { type: "string", nullable: true, description: "ID nhân viên TCKT thanh toán" },
                        nguoiGiao: { type: "object", properties: { id: { type: "string" }, hoTen: { type: "string" } } },
                        nguoiThucHien: { type: "object", nullable: true, properties: { id: { type: "string" }, hoTen: { type: "string" } } },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                HopDongUpdate: {
                    type: "object",
                    description: "Các trường có thể cập nhật (tùy thuộc quyền của user)",
                    properties: {
                        tenHopDong: { type: "string" },
                        giaTriHopDong: { type: "number" },
                        ngayKy: { type: "string", format: "date", description: "yyyy-mm-dd" },
                        ngayHieuLuc: { type: "string", format: "date" },
                        hieuLucBaoDam: { type: "string", format: "date" },
                        ngayGiaoHang: { type: "string", format: "date" },
                        ngayDuyetThanhToan: { type: "string", format: "date" },
                        hanBaoHanh: { type: "string", format: "date" },
                        tuChinhHopDong: { type: "string" },
                        giaTriGiaoNhan: { type: "number" },
                        giaTriNghiemThu: { type: "number" },
                        giaTriThanhToan: { type: "number", description: "Chỉ USER2_TCKT/ADMIN được sửa" },
                        giaTriQuyetToan: { type: "number", description: "Chỉ USER2_TCKT/ADMIN được sửa" },
                        daQuyetToan: { type: "boolean", description: "Đánh dấu quyết toán hoàn tất (khóa HĐ)" },
                        nguoiThucHienId: { type: "string", description: "Điều chuyển người thực hiện" },
                        nguoiThanhToanId: { type: "string", description: "Giao việc TCKT (chỉ ADMIN)" },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        username: { type: "string" },
                        hoTen: { type: "string", description: "Họ tên đầy đủ" },
                        role: { type: "string", enum: ["ADMIN", "USER1", "USER2", "USER2_TCKT"], description: "ADMIN=Quản trị, USER1=Lãnh đạo phòng, USER2=Nhân viên HĐ, USER2_TCKT=Nhân viên Tài chính kế toán" },
                    },
                },
            },
            securitySchemes: {
                session: {
                    type: "apiKey",
                    in: "cookie",
                    name: "authjs.session-token",
                    description: "NextAuth session cookie. Đăng nhập qua /api/auth/signin",
                },
            },
        },
    };

    return NextResponse.json(spec, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
