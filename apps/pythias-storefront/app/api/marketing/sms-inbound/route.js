export const dynamic = "force-dynamic";
import { StorefrontCustomer } from "@pythias/mongo";
import { suppress } from "@/lib/marketing";

// POST /api/marketing/sms-inbound — Twilio inbound SMS webhook. Honors STOP keywords by adding
// an SMS suppression for every org that has this phone on file. (Twilio's Advanced Opt-Out also
// auto-suppresses at the carrier level; this keeps OUR audience queries in sync.)
const STOP_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);

export async function POST(req) {
    let from = "", body = "";
    try {
        const form = await req.formData();
        from = String(form.get("From") || "");
        body = String(form.get("Body") || "").trim().toLowerCase();
    } catch { /* ignore */ }

    if (from && STOP_WORDS.has(body)) {
        const customers = await StorefrontCustomer.find({ phone: from }).select("orgId").lean();
        for (const c of customers) await suppress(c.orgId, "sms", from, "stop");
    }
    // Empty TwiML 200 so Twilio doesn't auto-reply.
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
