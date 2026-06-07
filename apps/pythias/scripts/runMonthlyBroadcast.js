import "dotenv/config";
import mongoose from "mongoose";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

const MONGO_URI = process.env.pythiasMongoURL || process.env.mongoURL;
await mongoose.connect(MONGO_URI);

// ── Minimal inline schemas (script context) ───────────────────────────────────
const LeadSequenceSchema = new mongoose.Schema({
    email: String, name: String, unsubscribed: Boolean, paused: Boolean,
}, { timestamps: true });
const ContactMessageSchema = new mongoose.Schema({
    email: String, name: String, source: String,
}, { timestamps: true });

const LeadSequence   = mongoose.models.LeadSequence   || mongoose.model("LeadSequence",   LeadSequenceSchema,   "lead_sequences");
const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema, "contact_messages");

// ── Build recipient list ───────────────────────────────────────────────────────
// Unsubscribed emails — no matter which source they're in
const unsubscribedSeqs = await LeadSequence.find({ unsubscribed: true }, "email").lean();
const unsubSet = new Set(unsubscribedSeqs.map(s => s.email?.toLowerCase()));

// All unique emails from contact messages + lead sequences
const allContacts  = await ContactMessage.find({}, "email name").lean();
const allSeqs      = await LeadSequence.find({}, "email name").lean();

const seen      = new Map(); // email → name
for (const c of [...allContacts, ...allSeqs]) {
    const e = c.email?.toLowerCase();
    if (e && !seen.has(e)) seen.set(e, c.name || "");
}

const recipients = [...seen.entries()]
    .filter(([email]) => !unsubSet.has(email))
    .map(([email, name]) => ({ email, name }));

console.log(`[monthly-broadcast] ${recipients.length} recipients (${unsubSet.size} opted out)`);

// ── Generate newsletter with Claude ───────────────────────────────────────────
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

const { content } = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
        role: "user",
        content: `You are the content team at Pythias Technologies, a print-on-demand fulfillment automation platform.

Write a monthly newsletter email for ${month}. The audience is print-on-demand business owners and operators who have shown interest in the platform.

Include:
1. A short intro (2 sentences max, friendly tone)
2. One practical tip or insight about running a POD business efficiently (3-4 sentences)
3. A brief product highlight — pick ONE from: multi-marketplace order sync, automatic label printing, real-time inventory, AI-powered product tools, or ShipStation integration
4. A soft CTA to book a demo or learn more

Format as clean HTML using only <p>, <h3>, <ul>, <li>, <strong>, <a> tags.
The CTA must be: <p style="text-align:center"><a href="https://pythiastechnologies.com/#calendar-booking-section" style="background:#D3A73D;color:#111;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block;">Book a Demo Call</a></p>
Keep total length under 300 words. Return ONLY the HTML body, no wrapping tags.`,
    }],
});

const newsletterBody = content[0].text;

// ── Email transport ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM  = "Pythias Technologies <info@pythiastechnologies.com>";
const BRAND = "#D3A73D";

function buildEmail(body, email) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#111827;padding:28px 40px;text-align:center;">
  <span style="color:${BRAND};font-size:22px;font-weight:700;">Pythias Technologies</span>
  <span style="color:rgba(255,255,255,.5);font-size:13px;display:block;margin-top:4px;">${month} Newsletter</span>
</td></tr>
<tr><td style="padding:40px;color:#374151;line-height:1.8;">${body}</td></tr>
<tr><td style="background:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#9ca3af;font-size:12px;">
    Pythias Technologies · 1421 Hidden View Drive, Lapeer MI 48446<br>
    <a href="https://pythiastechnologies.com" style="color:#9ca3af;">pythiastechnologies.com</a>
    &nbsp;·&nbsp;
    <a href="https://pythiastechnologies.com/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9ca3af;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Send in batches of 10 ─────────────────────────────────────────────────────
let sent = 0, failed = 0;
for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    await Promise.all(batch.map(async ({ email, name }) => {
        try {
            await resend.emails.send({
                from:    FROM,
                to:      email,
                subject: `Pythias Technologies — ${month} Update`,
                html:    buildEmail(newsletterBody, email),
            });
            sent++;
        } catch (e) {
            console.error(`[monthly-broadcast] failed ${email}:`, e.message);
            failed++;
        }
    }));
    // Brief pause between batches to stay under SMTP rate limits
    if (i + 10 < recipients.length) await new Promise(r => setTimeout(r, 1500));
}

await mongoose.disconnect();
console.log(`[monthly-broadcast] done — sent: ${sent}, failed: ${failed}, skipped (opted out): ${unsubSet.size}`);
