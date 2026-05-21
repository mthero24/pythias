import { NextResponse } from "next/server";
import { KlingInvoice, KlingVideo } from "@pythias/mongo";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req) {
    const month = parseInt(req.nextUrl.searchParams.get("month"));
    const year  = parseInt(req.nextUrl.searchParams.get("year"));
    if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

    const invoice = await KlingInvoice.findOne({ month, year }).lean();
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const videos = await KlingVideo.find({ month, year }).sort({ createdAt: 1 }).lean();

    // Build PDF with pdfkit
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
    const colW = (R - L) / 4;

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 70).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(20).text("PYTHIAS TECHNOLOGIES", L, 20);
    doc.font("Helvetica").fontSize(10).text("Kling AI Video Invoice", L, 44);
    doc.fillColor("#fff").fontSize(10)
        .text(`Invoice #: KLING-${year}-${String(month).padStart(2, "0")}`, R - 180, 20, { width: 180, align: "right" })
        .text(`Period: ${MONTH_NAMES[month - 1]} ${year}`,               R - 180, 36, { width: 180, align: "right" })
        .text(`Status: ${invoice.status.toUpperCase()}`,                  R - 180, 52, { width: 180, align: "right" });

    let y = 90;

    // ── Summary block ────────────────────────────────────────────────────────
    doc.rect(L, y, R - L, 56).fill(LIGHT);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
        .text("Rate per video",  L + 12, y + 10)
        .text("Videos generated", L + 130, y + 10)
        .text("Total due",        L + 270, y + 10);
    doc.fillColor(PURPLE).font("Helvetica-Bold").fontSize(16)
        .text(`$${invoice.ratePerVideo.toFixed(2)}`,     L + 12,  y + 28)
        .text(`${invoice.videoCount}`,                    L + 130, y + 28)
        .text(`$${invoice.totalAmount.toFixed(2)}`,      L + 270, y + 28);
    if (invoice.status === "paid" && invoice.paidAt) {
        doc.fillColor(GRAY).font("Helvetica").fontSize(8)
            .text(`Paid ${new Date(invoice.paidAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, L + 270, y + 48);
    }

    y += 72;

    // ── Table header ─────────────────────────────────────────────────────────
    doc.rect(L, y, R - L, 22).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9);
    doc.text("#",           L + 4,         y + 6, { width: 20 });
    doc.text("Date",        L + 28,        y + 6, { width: colW });
    doc.text("Product SKU", L + 28 + colW, y + 6, { width: colW });
    doc.text("Task ID",     L + 28 + colW * 2, y + 6, { width: colW * 1.4 });
    doc.text("Cost",        R - 40,        y + 6, { width: 40, align: "right" });
    y += 22;

    // ── Table rows ────────────────────────────────────────────────────────────
    videos.forEach((v, i) => {
        const rowH = 20;
        if (y + rowH > doc.page.height - 80) { doc.addPage(); y = 50; }

        if (i % 2 === 0) doc.rect(L, y, R - L, rowH).fill(LIGHT);
        doc.fillColor(DARK).font("Helvetica").fontSize(8.5);

        const dateStr = new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const truncTask = v.taskId.length > 28 ? v.taskId.slice(0, 25) + "…" : v.taskId;

        doc.text(String(i + 1),       L + 4,              y + 5, { width: 20 });
        doc.text(dateStr,             L + 28,             y + 5, { width: colW });
        doc.text(v.productSku ?? "—", L + 28 + colW,     y + 5, { width: colW });
        doc.text(truncTask,           L + 28 + colW * 2,  y + 5, { width: colW * 1.4 });
        doc.text(`$${v.cost.toFixed(2)}`, R - 40,         y + 5, { width: 40, align: "right" });
        y += rowH;
    });

    // ── Total row ─────────────────────────────────────────────────────────────
    y += 4;
    doc.rect(L, y, R - L, 26).fill(PURPLE);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11)
        .text("TOTAL", L + 12, y + 7)
        .text(`$${invoice.totalAmount.toFixed(2)}`, R - 40, y + 7, { width: 40, align: "right" });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.fillColor(GRAY).font("Helvetica").fontSize(8)
        .text("Pythias Technologies · pythiastechnologies.com", L, footerY, { width: R - L, align: "center" });

    doc.end();

    const buf = Buffer.concat(chunks);
    const filename = `kling-invoice-${MONTH_NAMES[month - 1].toLowerCase()}-${year}.pdf`;

    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
