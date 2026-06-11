import { NextResponse } from "next/server";
import { InventoryOrders, Inventory, Blank } from "@pythias/mongo";
import { sendEmail } from "@/lib/email";

const GOLD = "#D3A73D";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT = "#f9fafb";

async function buildPDF(order) {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks = [];
    doc.on("data", c => chunks.push(c));

    const pageW = doc.page.width;
    const L = 50, R = pageW - 50;

    // ── Header bar ──
    doc.rect(0, 0, pageW, 72).fill(DARK);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(20)
        .text("PURCHASE ORDER", L, 18);
    doc.fillColor("white").font("Helvetica").fontSize(10)
        .text("Premier Printing · Premier Fulfillment", L, 42);
    doc.fillColor("white").fontSize(10)
        .text(`PO #: ${order.poNumber || "—"}`,   R - 190, 18, { width: 190, align: "right" })
        .text(`Date: ${new Date(order.dateOrdered).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, R - 190, 33, { width: 190, align: "right" })
        .text(`Vendor: ${order.vendor || "—"}`,   R - 190, 48, { width: 190, align: "right" });

    let y = 90;

    // ── SanMar/SS auto-submission note ──
    if (order.submittedToSanmar || order.sanmarPONumber || order.sanmarResponse) {
        doc.rect(L, y, R - L, 18).fill("#f0fdf4");
        doc.fillColor("#065f46").font("Helvetica").fontSize(8)
            .text(
                order.submittedToSanmar
                    ? `Auto-submitted to supplier${order.sanmarPONumber ? ` — Supplier PO: ${order.sanmarPONumber}` : ""}`
                    : order.sanmarResponse || "",
                L + 8, y + 5, { width: R - L - 16 }
            );
        y += 26;
    }

    // ── Table header ──
    doc.rect(L, y, R - L, 22).fill(DARK);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    const cols = { sku: L + 8, desc: L + 130, qty: R - 130, cost: R - 80, total: R - 30 };
    doc.text("SKU",         cols.sku,  y + 6, { width: 120 });
    doc.text("Description", cols.desc, y + 6, { width: 90 });
    doc.text("Qty",         cols.qty,  y + 6, { width: 45, align: "right" });
    doc.text("Unit Cost",   cols.cost, y + 6, { width: 45, align: "right" });
    doc.text("Total",       cols.total - 5, y + 6, { width: 45, align: "right" });
    y += 22;

    // ── Line items ──
    let grandTotal = 0;
    let rowIdx = 0;

    for (const loc of order.locations ?? []) {
        for (const lineItem of loc.items ?? []) {
            const inv   = lineItem.inventory;
            if (!inv) continue;

            const blank = await Blank.findById(inv.blank).select("name sizes").lean();
            const size  = blank?.sizes?.find(s => s.name === inv.size_name);
            const cost  = size?.wholesaleCost || size?.basePrice || 0;
            const qty   = lineItem.quantity || 0;
            const line  = cost * qty;
            grandTotal += line;

            const rowH = 22;
            if (y + rowH > doc.page.height - 80) { doc.addPage(); y = 50; }
            if (rowIdx % 2 === 0) doc.rect(L, y, R - L, rowH).fill(LIGHT);

            const sku = `${inv.style_code}-${inv.color_name}-${inv.size_name}`;
            doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5)
                .text(sku, cols.sku, y + 6, { width: 120 });
            doc.font("Helvetica").fillColor(GRAY).fontSize(8)
                .text(blank?.name || "—", cols.desc, y + 6, { width: 90 });
            doc.fillColor(DARK).font("Helvetica").fontSize(8.5)
                .text(qty.toString(),                  cols.qty,        y + 6, { width: 45, align: "right" })
                .text(cost ? `$${cost.toFixed(2)}` : "—", cols.cost,   y + 6, { width: 45, align: "right" })
                .text(line  ? `$${line.toFixed(2)}` : "—", cols.total - 5, y + 6, { width: 45, align: "right" });
            y += rowH;
            rowIdx++;
        }
    }

    // ── Total row ──
    y += 4;
    doc.rect(L, y, R - L, 28).fill(DARK);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12)
        .text("TOTAL", L + 8, y + 8)
        .text(`$${grandTotal.toFixed(2)}`, cols.total - 5, y + 8, { width: 45, align: "right" });

    // ── Footer ──
    const footerY = doc.page.height - 36;
    doc.fillColor(GRAY).font("Helvetica").fontSize(8)
        .text("Premier Printing · pythiastechnologies.com", L, footerY, { width: R - L, align: "center" });

    doc.end();
    await new Promise(resolve => doc.on("end", resolve));
    return Buffer.concat(chunks);
}

// GET — download PDF
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await InventoryOrders.findById(orderId)
        .populate("locations.items.inventory")
        .lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buf      = await buildPDF(order);
    const filename = `invoice-${order.poNumber || orderId}.pdf`;
    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

// POST — generate + email
export async function POST(request) {
    try {
        const { orderId, email } = await request.json();
        if (!orderId || !email) {
            return NextResponse.json({ error: "orderId and email are required" }, { status: 400 });
        }

        const order = await InventoryOrders.findById(orderId)
            .populate("locations.items.inventory")
            .lean();
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const buf      = await buildPDF(order);
        const filename = `invoice-${order.poNumber || orderId}.pdf`;

        const dateStr = new Date(order.dateOrdered).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        await sendEmail({
            to:      email,
            subject: `Purchase Order #${order.poNumber || orderId} — ${order.vendor || "Inventory Order"}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <div style="background:#111827;padding:24px 32px;">
                        <span style="color:#D3A73D;font-size:20px;font-weight:700;">Premier Printing</span>
                    </div>
                    <div style="padding:32px;">
                        <h2 style="margin:0 0 16px;color:#111827;">Purchase Order #${order.poNumber || orderId}</h2>
                        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Vendor</td><td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;">${order.vendor || "—"}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Date Ordered</td><td style="padding:6px 0;color:#111827;font-size:14px;">${dateStr}</td></tr>
                            ${order.dateExpected ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Expected</td><td style="padding:6px 0;color:#111827;font-size:14px;">${new Date(order.dateExpected).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td></tr>` : ""}
                            ${order.sanmarPONumber ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Supplier PO</td><td style="padding:6px 0;color:#111827;font-size:14px;">${order.sanmarPONumber}</td></tr>` : ""}
                        </table>
                        <p style="color:#6b7280;font-size:13px;margin:0;">The full purchase order is attached as a PDF.</p>
                    </div>
                    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">Premier Printing · pythiastechnologies.com</p>
                    </div>
                </div>`,
            attachments: [{ filename, content: buf }],
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[invoice email]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
