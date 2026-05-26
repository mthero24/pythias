import { NextResponse } from "next/server";
import { ServiceInvoice } from "@pythias/mongo";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req) {
    const month = parseInt(req.nextUrl.searchParams.get("month"));
    const year  = parseInt(req.nextUrl.searchParams.get("year"));
    if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

    const invoice = await ServiceInvoice.findOne({ month, year }).lean();
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });

    const chunks = [];
    doc.on("data", c => chunks.push(c));
    await new Promise(resolve => doc.on("end", resolve));

    const PURPLE = "#7c3aed";
    const DARK   = "#111827";
    const GRAY   = "#6b7280";
    const LIGHT  = "#f3f4f6";

    const pageW = doc.page.width;
    const L = 50, R = pageW - 50;

    // Header
    doc.rect(0, 0, pageW, 70).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(20).text("PYTHIAS TECHNOLOGIES", L, 20);
    doc.font("Helvetica").fontSize(10).text("Monthly Service Invoice", L, 44);
    doc.fillColor("#fff").fontSize(10)
        .text(`Invoice #: SVC-${year}-${String(month).padStart(2, "0")}`, R - 180, 20, { width: 180, align: "right" })
        .text(`Period: ${MONTH_NAMES[month - 1]} ${year}`,               R - 180, 36, { width: 180, align: "right" })
        .text(`Status: ${invoice.status.toUpperCase()}`,                  R - 180, 52, { width: 180, align: "right" });

    let y = 90;

    // Line items table header
    doc.rect(L, y, R - L, 22).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9);
    doc.text("App / Service",  L + 8,    y + 6, { width: 260 });
    doc.text("Description",    L + 280,  y + 6, { width: 160 });
    doc.text("Monthly Price",  R - 80,   y + 6, { width: 80, align: "right" });
    y += 22;

    // Line item rows
    (invoice.lines ?? []).forEach((line, i) => {
        const rowH = 24;
        if (y + rowH > doc.page.height - 100) { doc.addPage(); y = 50; }
        if (i % 2 === 0) doc.rect(L, y, R - L, rowH).fill(LIGHT);
        doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9.5)
            .text(line.appName, L + 8, y + 7, { width: 260 });
        doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
            .text(line.description || "—", L + 280, y + 7, { width: 160 });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK)
            .text(`$${line.price.toFixed(2)}`, R - 80, y + 7, { width: 80, align: "right" });
        y += rowH;
    });

    // Total
    y += 6;
    doc.rect(L, y, R - L, 30).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(12)
        .text("TOTAL DUE", L + 12, y + 9)
        .text(`$${invoice.totalAmount.toFixed(2)}`, R - 80, y + 9, { width: 80, align: "right" });

    if (invoice.status === "paid" && invoice.paidAt) {
        y += 40;
        doc.fillColor(GRAY).font("Helvetica").fontSize(8)
            .text(`Paid on ${new Date(invoice.paidAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, L, y);
    }

    // Footer
    const footerY = doc.page.height - 40;
    doc.fillColor(GRAY).font("Helvetica").fontSize(8)
        .text("Pythias Technologies · pythiastechnologies.com", L, footerY, { width: R - L, align: "center" });

    doc.end();

    const buf = Buffer.concat(chunks);
    const filename = `service-invoice-${MONTH_NAMES[month - 1].toLowerCase()}-${year}.pdf`;

    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
