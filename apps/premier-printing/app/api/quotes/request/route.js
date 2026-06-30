import { NextResponse } from "next/server";
import { Quote, Organization } from "@pythias/mongo";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// PUBLIC (premier middleware excludes /api). The customer "Design & Send In" studio submits here.
// Creates a `requested` quote with ZERO prices — the shop prices it, then the existing
// send → /quote/[token] → approve+pay → convert flow takes over. No pricing is ever exposed
// to the customer at this stage.
const normalizeLine = (l) => ({
    sku: l.sku || "", title: l.title || l.blankName || "", blank: l.blank || null, styleCode: l.styleCode || "",
    color: l.color || null, colorName: l.colorName || "", size: l.size || null, sizeName: l.sizeName || "",
    design: l.design || undefined, personalization: l.personalization || undefined,
    printType: l.printType || "", image: l.image || "",
    quantity: Math.max(1, parseInt(l.quantity) || 1), unitPrice: 0, setupFee: 0, byob: !!l.byob, notes: l.notes || "",
});

export async function POST(request) {
    try {
        const data  = await request.json();
        const lines = (data.lines || []).map(normalizeLine);
        if (!lines.length) return NextResponse.json({ error: "Add at least one item to your request" }, { status: 400 });
        if (!data.customer?.email && !data.customer?.name) return NextResponse.json({ error: "Add your name or email so we can send your quote" }, { status: 400 });

        const quote = await Quote.create({
            quoteId: `QUOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            token:   crypto.randomBytes(16).toString("hex"),
            status:  "requested",
            customer: data.customer || {},
            lines,
            total: 0,
            message: data.message || "",
            shippingAddress: data.shippingAddress,
        });

        // Best-effort notify the shop that a new request came in.
        try {
            const org = await Organization.findOne({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" }).select("name billingEmail").lean();
            const to = org?.billingEmail || process.env.QUOTE_REQUEST_NOTIFY_EMAIL;
            if (to) {
                const units = lines.reduce((s, l) => s + (l.quantity || 1), 0);
                await sendEmail({
                    to,
                    subject: `New quote request — ${quote.quoteId}`,
                    html: `<p>A new Design &amp; Send In request just came in.</p>
                        <p><strong>${data.customer?.name || "Customer"}</strong> (${data.customer?.email || "no email"})<br/>
                        ${lines.length} line(s) · ${units} unit(s)</p>
                        <p>Open it in your Quotes dashboard to price it and send it back.</p>`,
                });
            }
        } catch (e) { console.error("[quote request notify]", e.message); }

        return NextResponse.json({ ok: true, quoteId: quote.quoteId });
    } catch (err) {
        console.error("[quote request]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
