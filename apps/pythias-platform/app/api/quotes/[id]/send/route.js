import { NextResponse } from "next/server";
import { PlatformQuote as Quote, Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

function quoteEmailHtml({ brandName, quote, url, due }) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#111827;padding:24px 32px;"><span style="color:#D3A73D;font-size:20px;font-weight:700;">${brandName}</span></div>
        <div style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#111827;">Your quote is ready</h2>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${quote.customer?.name ? quote.customer.name + ", we" : "We"}&rsquo;ve put together your quote (${quote.quoteId}). Review the details and approve when you&rsquo;re ready.</p>
            ${quote.message ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;color:#374151;font-size:14px;margin-bottom:20px;">${quote.message}</div>` : ""}
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="color:#6b7280;font-size:13px;">Total</div>
                <div style="color:#111827;font-size:32px;font-weight:700;">$${due.toFixed(2)}</div>
            </div>
            <a href="${url}" style="display:block;background:#D3A73D;color:#111827;text-decoration:none;font-weight:700;text-align:center;padding:14px;border-radius:8px;font-size:16px;">Review &amp; Approve</a>
            <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;text-align:center;">Approve and pay securely online — your order goes straight into production.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="margin:0;color:#9ca3af;font-size:12px;">${brandName} · pythiastechnologies.com</p></div>
    </div>`;
}

// POST /api/quotes/[id]/send — mark the quote sent and email the customer a link to the
// public review/approve page. The customer pays there; payment converts it to an order.
export async function POST(request, { params }) {
    try {
        const token = await getToken({ req: request });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const quote = await Quote.findOne({ _id: params.id, orgId });
        if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const email = quote.customer?.email;
        if (!email) return NextResponse.json({ error: "Add a customer email before sending" }, { status: 400 });

        const org = await Organization.findById(orgId).select("name").lean();
        if (!quote.token) quote.token = crypto.randomBytes(16).toString("hex");
        quote.status = "sent";
        quote.sentAt = new Date();
        await quote.save();

        const base = (process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
        const url  = `${base}/quote/${quote.token}`;
        const due  = (quote.total || 0) - (quote.discountAmount || 0);
        await sendEmail({
            to: email,
            subject: `Your quote from ${org?.name || "Pythias"} — $${due.toFixed(2)}`,
            html: quoteEmailHtml({ brandName: org?.name || "Pythias", quote, url, due }),
        });
        return NextResponse.json({ ok: true, url });
    } catch (err) {
        console.error("[quote send]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
