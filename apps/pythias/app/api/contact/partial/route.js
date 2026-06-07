import { NextResponse } from "next/server";
import { ContactMessage, LeadSequence } from "@pythias/mongo";

export async function POST(req) {
    try {
        const { name, email, company, orderVolume, challenges } = await req.json();
        if (!email?.trim()) return NextResponse.json({ success: false });

        const normalizedEmail = email.trim().toLowerCase();

        // Save / update partial contact record
        await ContactMessage.findOneAndUpdate(
            { email: normalizedEmail, source: "lead_capture_partial" },
            {
                $set: {
                    name:    name?.trim() || "Unknown",
                    email:   normalizedEmail,
                    company: company?.trim() || "",
                    message: "Partial form — visitor did not submit.",
                    source:  "lead_capture_partial",
                    meta: { orderVolume: orderVolume || null, challenges: challenges || null, partialSavedAt: new Date() },
                },
                $setOnInsert: { read: false },
            },
            { upsert: true }
        );

        // Start drip sequence if not already enrolled
        const existing = await LeadSequence.findOne({ email: normalizedEmail });
        if (!existing) {
            await LeadSequence.create({
                email: normalizedEmail,
                name:    name?.trim() || "",
                company: company?.trim() || "",
                source:  "lead_capture",
                step:    0,
                nextSendAt: new Date(), // cron picks up immediately
                meta: { orderVolume, challenges },
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[contact/partial]", e);
        return NextResponse.json({ success: false });
    }
}
