import { NextResponse } from "next/server";
import { Order, Item } from "@pythias/mongo";
import { sendEmail } from "@/lib/email";

const GOLD  = "#D3A73D";
const DARK  = "#111827";
const GRAY  = "#6b7280";
const LIGHT = "#f9fafb";

async function buildPDF(order, items, brandName = "Premier Printing") {
    const PDFDocument = (await import("pdfkit")).default;
    const doc    = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks = [];
    doc.on("data", c => chunks.push(c));

    const pageW = doc.page.width;
    const L = 50, R = pageW - 50;

    // ── Header ──
    doc.rect(0, 0, pageW, 72).fill(DARK);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(20).text("INVOICE", L, 18);
    doc.fillColor("white").font("Helvetica").fontSize(10).text(`${brandName} · Custom Order`, L, 42);
    doc.fillColor("white").fontSize(10)
        .text(`PO #: ${order.poNumber || "—"}`,    R - 190, 18, { width: 190, align: "right" })
        .text(`Date: ${new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, R - 190, 33, { width: 190, align: "right" })
        .text(`Status: ${order.paid ? "Paid" : "Awaiting Payment"}`, R - 190, 48, { width: 190, align: "right" });

    let y = 90;

    // ── Customer info ──
    const addr = order.shippingAddress || {};
    const customerLines = [
        addr.address2 || "", // company stored in address2
        addr.name    || "",
        order.customerEmail || "",
        addr.phone   || "",
        [addr.address1, addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    ].filter(Boolean);

    if (customerLines.length) {
        doc.rect(L, y, R - L, 18).fill(LIGHT);
        doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("BILL TO", L + 8, y + 5);
        y += 22;
        for (const line of customerLines) {
            doc.fillColor(DARK).font("Helvetica").fontSize(9).text(line, L + 8, y, { width: R - L - 16 });
            y += 13;
        }
        y += 8;
        if (order.shipByDate) {
            doc.fillColor(GRAY).font("Helvetica").fontSize(8).text(`Date Needed: ${new Date(order.shipByDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, L, y, { width: R - L, align: "right" });
            y += 14;
        }
        y += 4;
    }

    // ── Aggregate items by styleCode+colorName+sizeName+price ──
    const lineMap = new Map();
    for (const item of items) {
        const key = `${item.styleCode}|${item.colorName}|${item.sizeName}|${item.price}`;
        if (!lineMap.has(key)) {
            lineMap.set(key, { styleCode: item.styleCode, colorName: item.colorName, sizeName: item.sizeName, price: item.price || 0, qty: 0, design: item.design || {} });
        }
        lineMap.get(key).qty += 1;
    }
    const lineItems = [...lineMap.values()];

    // ── Table header ──
    doc.rect(L, y, R - L, 22).fill(DARK);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    const cols = { desc: L + 8, locs: L + 180, qty: R - 140, unit: R - 90, total: R - 30 };
    doc.text("Description",     cols.desc,  y + 6, { width: 170 });
    doc.text("Print Locations", cols.locs,  y + 6, { width: 88  });
    doc.text("Qty",             cols.qty,   y + 6, { width: 45, align: "right" });
    doc.text("Unit Price",      cols.unit,  y + 6, { width: 55, align: "right" });
    doc.text("Total",           cols.total - 5, y + 6, { width: 45, align: "right" });
    y += 22;

    let subtotal = 0;
    let rowIdx   = 0;

    for (const li of lineItems) {
        const line = li.qty * li.price;
        subtotal  += line;
        const locs = Object.keys(li.design || {}).join(", ") || "—";
        const rowH = 24;
        if (y + rowH > doc.page.height - 100) { doc.addPage(); y = 50; }
        if (rowIdx % 2 === 0) doc.rect(L, y, R - L, rowH).fill(LIGHT);

        doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5).text(li.styleCode || "—", cols.desc, y + 5, { width: 170 });
        doc.fillColor(GRAY).font("Helvetica").fontSize(7.5).text(`${li.colorName || ""}  ${li.sizeName || ""}`.trim(), cols.desc, y + 15, { width: 170 });
        doc.fillColor(GRAY).font("Helvetica").fontSize(7.5).text(locs, cols.locs, y + 8, { width: 88 });
        doc.fillColor(DARK).font("Helvetica").fontSize(8.5)
            .text(li.qty.toString(),                          cols.qty,       y + 8, { width: 45, align: "right" })
            .text(li.price ? `$${li.price.toFixed(2)}` : "—",cols.unit,      y + 8, { width: 55, align: "right" })
            .text(line     ? `$${line.toFixed(2)}`     : "—",cols.total - 5, y + 8, { width: 45, align: "right" });
        y += rowH;
        rowIdx++;
    }

    // ── Totals ──
    y += 6;
    const shipping = order.shippingCost || 0;
    const taxRate  = order.taxRate      || 0;
    const tax      = subtotal * taxRate;
    const total    = subtotal + shipping + tax;

    const drawRow = (label, value, isBold = false) => {
        doc.fillColor(isBold ? GOLD : GRAY).font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 11 : 9)
            .text(label, R - 200, y, { width: 150, align: "right" });
        doc.fillColor(isBold ? GOLD : DARK).font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 11 : 9)
            .text(`$${value.toFixed(2)}`, R - 45, y, { width: 45, align: "right" });
        y += isBold ? 18 : 14;
    };

    if (y + 80 > doc.page.height - 50) { doc.addPage(); y = 50; }
    doc.rect(L, y - 4, R - L, 1).fill("#e5e7eb");
    y += 4;
    drawRow("Subtotal", subtotal);
    if (shipping > 0) drawRow("Shipping", shipping);
    if (taxRate  > 0) drawRow(`Tax (${(taxRate * 100).toFixed(1)}%)`, tax);
    doc.rect(L, y, R - L, 26).fill(DARK);
    y += 4;
    drawRow("TOTAL DUE", total, true);

    // ── Notes ──
    const noteText = order.notes?.[0]?.note;
    if (noteText) {
        y += 12;
        if (y + 40 > doc.page.height - 50) { doc.addPage(); y = 50; }
        doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("NOTES", L, y);
        y += 12;
        doc.fillColor(DARK).font("Helvetica").fontSize(8).text(noteText, L, y, { width: R - L });
    }

    const footerY = doc.page.height - 36;
    doc.fillColor(GRAY).font("Helvetica").fontSize(8).text(`${brandName} · pythiastechnologies.com`, L, footerY, { width: R - L, align: "center" });

    doc.end();
    await new Promise(resolve => doc.on("end", resolve));
    return Buffer.concat(chunks);
}

async function getOrderWithItems(orderId) {
    const order = await Order.findOne({ _id: orderId, marketplace: "custom order" }).lean();
    if (!order) return null;
    const items = await Item.find({ order: order._id }).lean();
    return { order, items };
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const result = await getOrderWithItems(orderId);
    if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buf      = await buildPDF(result.order, result.items);
    const filename = `invoice-${result.order.poNumber || orderId}.pdf`;
    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

export async function POST(request) {
    try {
        const { orderId, email } = await request.json();
        if (!orderId || !email) return NextResponse.json({ error: "orderId and email are required" }, { status: 400 });

        const result = await getOrderWithItems(orderId);
        if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const { order, items } = result;
        const buf      = await buildPDF(order, items);
        const filename = `invoice-${order.poNumber || orderId}.pdf`;
        const addr     = order.shippingAddress || {};
        const subtotal = items.reduce((s, i) => s + (i.price || 0), 0);
        const tax      = subtotal * (order.taxRate || 0);
        const total    = subtotal + (order.shippingCost || 0) + tax;

        await sendEmail({
            to: email,
            subject: `Invoice #${order.poNumber || orderId} — Premier Printing`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <div style="background:#111827;padding:24px 32px;">
                        <span style="color:#D3A73D;font-size:20px;font-weight:700;">Premier Printing</span>
                    </div>
                    <div style="padding:32px;">
                        <h2 style="margin:0 0 16px;color:#111827;">Invoice #${order.poNumber || orderId}</h2>
                        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                            ${addr.name    ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Name</td><td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;">${addr.name}</td></tr>` : ""}
                            ${addr.address2 ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Company</td><td style="padding:6px 0;color:#111827;font-size:14px;">${addr.address2}</td></tr>` : ""}
                            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Total Due</td><td style="padding:6px 0;color:#111827;font-weight:700;font-size:16px;">$${total.toFixed(2)}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Status</td><td style="padding:6px 0;color:#111827;font-size:14px;">${order.paid ? "Paid" : "Awaiting Payment"}</td></tr>
                        </table>
                        <p style="color:#6b7280;font-size:13px;margin:0;">The full invoice is attached as a PDF.</p>
                    </div>
                    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">Premier Printing · pythiastechnologies.com</p>
                    </div>
                </div>`,
            attachments: [{ filename, content: buf }],
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[custom-order invoice email]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
