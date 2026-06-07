/**
 * Monthly product update email
 * - Sends to all active Platform users (pythias DB)
 * - Sends to all active Premier Printing users (premierprinting DB)
 * - Uses Claude to write engaging update content from monthly-update-notes.txt
 *
 * Runs on the 1st of each month via PM2 cron.
 * Edit scripts/monthly-update-notes.txt before the 1st with this month's changes.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_FILE = path.join(__dirname, "monthly-update-notes.txt");
const notes = fs.existsSync(NOTES_FILE) ? fs.readFileSync(NOTES_FILE, "utf-8").trim() : "";

const month  = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
const ai     = new Resend(process.env.RESEND_API_KEY) && new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Pythias Technologies <info@pythiastechnologies.com>";
const BRAND  = "#D3A73D";

// ── User schemas (minimal — script context) ───────────────────────────────────
const userSchema = new mongoose.Schema({ email: String, firstName: String, lastName: String, isActive: Boolean, role: String });

// ── Claude email writer ────────────────────────────────────────────────────────
async function generateUpdateEmail({ platform, audience, notes }) {
    const notesSection = notes && !notes.includes("[Add your updates here]")
        ? `\n\nThis month's actual updates:\n${notes}`
        : "\n\nHighlight realistic-sounding improvements relevant to this platform.";

    const prompt = `You are the product team at Pythias Technologies writing a monthly product update email for ${platform} users.

Audience: ${audience}${notesSection}

Write a concise, enthusiastic product update email covering:
1. A short warm intro (1-2 sentences, mention the month: ${month})
2. New features or improvements (3-4 bullet points, make them specific and benefit-focused)
3. One improvement or fix worth calling out
4. A brief closing with a link to see it in action or book a demo call

Guidelines:
- Friendly but professional tone
- Under 250 words
- Each bullet: "Feature name — what it means for them" format
- End CTA button: <p style="text-align:center"><a href="https://pythiastechnologies.com/#calendar-booking-section" style="background:${BRAND};color:#111;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block;">See What's New</a></p>
- Return ONLY the email body HTML using <p>, <ul>, <li>, <strong>, <h3> tags. No wrapping.`;

    const msg = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
    });

    return msg.content[0].text;
}

function wrapTemplate(body, email, platformName) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#111827;padding:28px 40px;text-align:center;">
  <span style="color:${BRAND};font-size:22px;font-weight:700;">${platformName}</span>
  <span style="color:rgba(255,255,255,.5);font-size:13px;display:block;margin-top:4px;">${month} Product Update</span>
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

async function sendBatch(users, subject, bodyHtml, platformName) {
    let sent = 0, skipped = 0;
    for (let i = 0; i < users.length; i += 10) {
        const batch = users.slice(i, i + 10);
        await Promise.all(batch.map(async user => {
            if (!user.email) { skipped++; return; }
            try {
                await resend.emails.send({
                    from:    FROM,
                    to:      user.email,
                    subject,
                    html:    wrapTemplate(bodyHtml, user.email, platformName),
                });
                sent++;
            } catch (e) {
                console.error(`  Failed ${user.email}: ${e.message}`);
                skipped++;
            }
        }));
        if (i + 10 < users.length) await new Promise(r => setTimeout(r, 1500));
    }
    return { sent, skipped };
}

// ── Platform users (Platform DB) ──────────────────────────────────────────────
const platformConn = mongoose.createConnection(process.env.PLATFORM_MONGO_URL);
const PlatformUser = platformConn.model("User", userSchema);

const platformUsers = await PlatformUser.find({ isActive: { $ne: false }, email: { $exists: true, $ne: "" } })
    .select("email firstName lastName").lean();

console.log(`[product-update] Platform users: ${platformUsers.length}`);

const platformBody = await generateUpdateEmail({
    platform: "Pythias Fulfillment Cloud",
    audience: "Platform users managing multi-channel POD fulfillment, orders, inventory, and marketplace integrations",
    notes,
});

const platformResult = await sendBatch(
    platformUsers,
    `What's new in Pythias Fulfillment Cloud — ${month}`,
    platformBody,
    "Pythias Fulfillment Cloud"
);
console.log(`[product-update] Platform: sent ${platformResult.sent}, skipped ${platformResult.skipped}`);

await platformConn.close();

// ── Premier Printing users (PremierPrinting DB) ────────────────────────────────
const premierConn = mongoose.createConnection(process.env.premierPrintingMongoURL || process.env.mongoURL);
const PremierUser = premierConn.model("User", userSchema);

const premierUsers = await PremierUser.find({ isActive: { $ne: false }, email: { $exists: true, $ne: "" } })
    .select("email firstName lastName").lean();

console.log(`[product-update] Premier Printing users: ${premierUsers.length}`);

const premierBody = await generateUpdateEmail({
    platform: "Premier Printing Production",
    audience: "Production floor staff and managers using Premier Printing for label printing, DTF workflow, inventory, ShipStation integration, and order fulfillment",
    notes,
});

const premierResult = await sendBatch(
    premierUsers,
    `Premier Printing — ${month} Update`,
    premierBody,
    "Premier Printing"
);
console.log(`[product-update] Premier: sent ${premierResult.sent}, skipped ${premierResult.skipped}`);

await premierConn.close();
console.log("[product-update] Done.");
