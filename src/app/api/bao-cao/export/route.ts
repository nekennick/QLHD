import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    AlignmentType,
    BorderStyle,
} from "docx";
import ExcelJS from "exceljs";

type ReportType = "all" | "incomplete" | "delivering" | "late" | "expiring" | "accepted" | "paid" | "completed";

async function getReportData(type: ReportType, nguoiThucHienId?: string) {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const where: Record<string, unknown> = {};

    if (nguoiThucHienId) {
        where.nguoiThucHienId = nguoiThucHienId;
    }

    switch (type) {
        case "incomplete":
            where.OR = [{ tenHopDong: null }, { giaTriHopDong: null }, { ngayKy: null }];
            break;
        case "delivering":
            where.giaTriGiaoNhan = { not: null };
            where.ngayDuyetThanhToan = null;
            break;
        case "late":
            where.ngayGiaoHang = { lt: today };
            where.giaTriGiaoNhan = null;
            break;
        case "expiring":
            where.hieuLucBaoDam = { gte: today, lte: sevenDaysLater };
            break;
        case "accepted":
            where.giaTriNghiemThu = { not: null };
            where.ngayDuyetThanhToan = null;
            break;
        case "paid":
            where.ngayDuyetThanhToan = { not: null };
            break;
        case "completed":
            where.hanBaoHanh = { lt: today };
            break;
    }

    return prisma.hopDong.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            nguoiThucHien: { select: { hoTen: true } },
        },
    });
}

const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};

const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN");
};

// Generate Word Document
async function generateDocx(contracts: Awaited<ReturnType<typeof getReportData>>) {
    const today = new Date().toLocaleDateString("vi-VN");

    const headerRow = new TableRow({
        children: ["STT", "Số hợp đồng", "Tên hợp đồng", "Giá trị", "Ngày ký", "Giao nhận", "Nghiệm thu", "Thanh toán", "Quyết toán", "Người thực hiện"].map(
            (text) =>
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22 })] })],
                    shading: { fill: "E0E0E0" },
                })
        ),
    });

    const dataRows = contracts.map((contract, index) =>
        new TableRow({
            children: [
                String(index + 1),
                contract.soHopDong,
                contract.tenHopDong || "—",
                formatCurrency(contract.giaTriHopDong),
                formatDate(contract.ngayKy),
                formatCurrency(contract.giaTriGiaoNhan),
                formatCurrency(contract.giaTriNghiemThu),
                formatCurrency(contract.giaTriThanhToan),
                formatCurrency(contract.giaTriQuyetToan),
                contract.nguoiThucHien?.hoTen || "—",
            ].map(
                (text) =>
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
                    })
            ),
        })
    );

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "BÁO CÁO THỰC HIỆN HỢP ĐỒNG", bold: true, size: 32 })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Ngày ${today}`, italics: true, size: 24 })],
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [headerRow, ...dataRows],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                        },
                    }),
                ],
            },
        ],
    });

    return Packer.toBuffer(doc);
}

// Generate Excel Document
async function generateExcel(contracts: Awaited<ReturnType<typeof getReportData>>) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Báo cáo hợp đồng");

    // Title
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "BÁO CÁO THỰC HIỆN HỢP ĐỒNG";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center" };

    // Date
    worksheet.mergeCells("A2:I2");
    const dateCell = worksheet.getCell("A2");
    dateCell.value = `Ngày ${new Date().toLocaleDateString("vi-VN")}`;
    dateCell.font = { italic: true, size: 12 };
    dateCell.alignment = { horizontal: "center" };

    // Headers
    const headers = ["STT", "Số hợp đồng", "Tên hợp đồng", "Giá trị", "Ngày ký", "Giao nhận", "Nghiệm thu", "Thanh toán", "Quyết toán", "Người thực hiện"];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });

    // Data
    contracts.forEach((contract, index) => {
        const row = worksheet.addRow([
            index + 1,
            contract.soHopDong,
            contract.tenHopDong || "—",
            contract.giaTriHopDong || 0,
            contract.ngayKy ? new Date(contract.ngayKy) : "—",
            contract.giaTriGiaoNhan || 0,
            contract.giaTriNghiemThu || 0,
            contract.giaTriThanhToan || 0,
            contract.giaTriQuyetToan || 0,
            contract.nguoiThucHien?.hoTen || "—",
        ]);
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
    });

    // Format currency columns
    worksheet.getColumn(4).numFmt = '#,##0" đ"';
    worksheet.getColumn(6).numFmt = '#,##0" đ"';
    worksheet.getColumn(7).numFmt = '#,##0" đ"';
    worksheet.getColumn(8).numFmt = '#,##0" đ"';
    worksheet.getColumn(9).numFmt = '#,##0" đ"';
    worksheet.getColumn(5).numFmt = "DD/MM/YYYY";

    // Auto width
    worksheet.columns.forEach((column) => {
        column.width = 15;
    });
    worksheet.getColumn(3).width = 30; // Tên HĐ

    return workbook.xlsx.writeBuffer();
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "xlsx";
    const type = (searchParams.get("type") as ReportType) || "all";
    const nguoiThucHienId = searchParams.get("nguoiThucHien") || undefined;

    try {
        const contracts = await getReportData(type, nguoiThucHienId);

        let buffer: Buffer | ArrayBuffer;
        let contentType: string;
        let filename: string;

        const timestamp = new Date().toISOString().split("T")[0];

        switch (format) {
            case "docx":
                buffer = await generateDocx(contracts);
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                filename = `bao-cao-hop-dong-${timestamp}.docx`;
                break;
            case "xlsx":
                buffer = await generateExcel(contracts);
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                filename = `bao-cao-hop-dong-${timestamp}.xlsx`;
                break;
            default:
                return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        return new NextResponse(buffer as BodyInit, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
