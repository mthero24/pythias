import "dotenv/config";
import mongoose from "mongoose";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// ── DB connection ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.pythiasMongoURL || process.env.mongoURL;
await mongoose.connect(MONGO_URI);

const LeadSequenceSchema = new mongoose.Schema({
    email:        String,
    name:         String,
    company:      String,
    source:       String,
    step:         Number,
    nextSendAt:   Date,
    lastSentAt:   Date,
    completed:    Boolean,
    unsubscribed: Boolean,
    meta:         mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const ContactMessageSchema = new mongoose.Schema({
    email: String, name: String, company: String,
    message: String, source: String, meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const LeadSequence  = mongoose.models.LeadSequence  || mongoose.model("LeadSequence",  LeadSequenceSchema,  "lead_sequences");
const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema, "contact_messages");

// ── Email transport ───────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM  = "Pythias Technologies <info@pythiastechnologies.com>";
const BRAND = "#D3A73D";

// ── Drip sequence config ──────────────────────────────────────────────────────
// Each step fires at the given delay after enrollment
const STEPS = [
    { delayDays: 0,  subject: "Thanks for reaching out — here's what happens next",   topic: "welcome_and_overview" },
    { delayDays: 3,  subject: "How Pythias works — a 2-minute overview",               topic: "workflow_and_features" },
    { delayDays: 7,  subject: "What does Pythias actually cost?",                      topic: "pricing_and_roi" },
    { delayDays: 14, subject: "Still thinking it over? Let's make it easy.",           topic: "final_followup" },
];

const SEND_HOUR_UTC = 15; // 10am EST = 15:00 UTC

function nextSendDate(delayDays) {
    const d = new Date();
    d.setDate(d.getDate() + delayDays);
    d.setUTCHours(SEND_HOUR_UTC, 0, 0, 0);
    return d;
}

// ── Claude personalization ────────────────────────────────────────────────────
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function personalizeEmail({ name, company, source, meta, topic, subject }) {
    const context = [
        name    && `Name: ${name}`,
        company && `Company: ${company}`,
        source  && `How they found us: ${source.replace(/_/g, " ")}`,
        meta?.orderVolume  && `Monthly order volume: ${meta.orderVolume}`,
        meta?.challenges   && `Their challenges: ${meta.challenges}`,
    ].filter(Boolean).join("\n");

    const CALENDAR_URL = "https://pythiastechnologies.com/#calendar-booking-section";
    const prompt = `You are the friendly, knowledgeable sales team at Pythias Technologies, a print-on-demand fulfillment automation platform.

Write a concise, warm marketing email with subject line "${subject}" for the following prospect:

${context || "No additional context available."}

Topic to cover: ${topic}

Guidelines:
- Address them by first name (${name?.split(" ")[0] || "there"})
- Keep it under 200 words — punchy, no fluff
- Reference any specific details they shared (challenges, order volume) to make it personal
- ALWAYS include a natural mention of the calendar booking link somewhere in the body, e.g. "If you'd like to chat, grab a time on our calendar here: ${CALENDAR_URL}"
- End with one prominent CTA button linking to ${CALENDAR_URL}
- The CTA button HTML must be: <p style="text-align:center"><a href="${CALENDAR_URL}" style="background:#D3A73D;color:#111;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;">Book a Time on Our Calendar</a></p>
- Plain conversational tone — not salesy or corporate
- Return ONLY the email body HTML (no subject line, no headers). Use <p> tags.`;

    const msg = await ai.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
    });

    return msg.content[0].text;
}

function wrapTemplate(bodyHtml, email) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
<tr><td style="background:#111827;padding:28px 40px;text-align:center;">
  <span style="color:${BRAND};font-size:22px;font-weight:700;">Pythias Technologies</span>
</td></tr>
<tr><td style="padding:40px;color:#374151;line-height:1.7;">${bodyHtml}</td></tr>
<tr><td style="background:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#9ca3af;font-size:12px;">
    Pythias Technologies · 1421 Hidden View Drive, Lapeer MI 48446<br>
    <a href="https://pythiastechnologies.com" style="color:#9ca3af;">pythiastechnologies.com</a>
    &nbsp;·&nbsp;
    <a href="https://pythiastechnologies.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9ca3af;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Main loop ─────────────────────────────────────────────────────────────────
const now = new Date();
const due  = await LeadSequence.find({
    nextSendAt:   { $lte: now },
    completed:    { $ne: true },
    unsubscribed: { $ne: true },
    paused:       { $ne: true },
});

console.log(`[marketing-emails] ${due.length} leads to process`);

for (const lead of due) {
    const stepIdx = lead.step ?? 0;
    const step    = STEPS[stepIdx];
    if (!step) {
        await LeadSequence.updateOne({ _id: lead._id }, { $set: { completed: true } });
        continue;
    }

    // Pull any extra context they submitted in the contact form
    const contact = await ContactMessage.findOne({ email: lead.email }).sort({ createdAt: -1 }).lean();
    const meta    = { ...lead.meta, message: contact?.message };

    try {
        const bodyHtml = await personalizeEmail({
            name:    lead.name,
            company: lead.company,
            source:  lead.source,
            meta,
            topic:   step.topic,
            subject: step.subject,
        });

        await resend.emails.send({
            from:    FROM,
            to:      lead.email,
            subject: step.subject,
            html:    wrapTemplate(bodyHtml, lead.email),
        });

        console.log(`[marketing-emails] sent step ${stepIdx} to ${lead.email}`);

        const nextStepIdx = stepIdx + 1;
        const nextStep    = STEPS[nextStepIdx];
        await LeadSequence.updateOne({ _id: lead._id }, {
            $set: {
                step:       nextStepIdx,
                lastSentAt: now,
                nextSendAt: nextStep ? nextSendDate(nextStep.delayDays) : null,
                completed:  !nextStep,
            },
        });
    } catch (e) {
        console.error(`[marketing-emails] failed for ${lead.email}:`, e.message);
    }
}

await mongoose.disconnect();
console.log("[marketing-emails] done");
