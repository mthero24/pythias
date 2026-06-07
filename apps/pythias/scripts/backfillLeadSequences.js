/**
 * One-time backfill: enrols existing ContactMessage records into the drip
 * sequence starting at step 1 (skipping the stale "thanks for reaching out").
 *
 * Run once:
 *   node --experimental-vm-modules scripts/backfillLeadSequences.js
 *   (or via: npm exec node scripts/backfillLeadSequences.js)
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.pythiasMongoURL || process.env.mongoURL;
await mongoose.connect(MONGO_URI);

const ContactMessageSchema = new mongoose.Schema(
    { email: String, name: String, company: String, source: String },
    { timestamps: true }
);
const LeadSequenceSchema = new mongoose.Schema(
    { email: String, name: String, company: String, source: String,
      step: Number, nextSendAt: Date, completed: Boolean, unsubscribed: Boolean, paused: Boolean },
    { timestamps: true }
);

const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema, "contact_messages");
const LeadSequence   = mongoose.models.LeadSequence   || mongoose.model("LeadSequence",   LeadSequenceSchema,   "lead_sequences");

// Pull all real contact messages (skip partial captures)
const messages = await ContactMessage.find({
    source: { $nin: ["lead_capture_partial"] },
    email:  { $exists: true, $ne: "" },
}).lean();

// Get already-enrolled emails
const existing = await LeadSequence.find({}, "email").lean();
const enrolledEmails = new Set(existing.map(s => s.email?.toLowerCase()));

const toInsert = [];
const seen     = new Set();

for (const msg of messages) {
    const email = msg.email?.toLowerCase().trim();
    if (!email || enrolledEmails.has(email) || seen.has(email)) continue;
    seen.add(email);

    // Start at step 1 — skip the stale "thanks for reaching out"
    // nextSendAt = now so the cron sends it today
    toInsert.push({
        email,
        name:      msg.name    || "",
        company:   msg.company || "",
        source:    msg.source  || "contact_form",
        step:      1,
        nextSendAt: new Date(),
        completed:    false,
        unsubscribed: false,
        paused:       false,
    });
}

if (toInsert.length === 0) {
    console.log("[backfill] Nothing to enrol — all contacts already have a sequence record.");
} else {
    await LeadSequence.insertMany(toInsert, { ordered: false });
    console.log(`[backfill] Enrolled ${toInsert.length} existing contacts starting at step 1.`);
    toInsert.forEach(r => console.log(`  • ${r.email}`));
}

await mongoose.disconnect();
