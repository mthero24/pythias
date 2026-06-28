import { NextResponse } from "next/server";
import { ContactMessage, LeadSequence } from "@pythias/mongo";
import { sendEmail, sendInternalAlert, SEQUENCE, nextSendDate } from "@/lib/email";

export async function POST(req) {
    try {
        const { name, company, phone, email, message, source, partial } = await req.json();
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json({ success: false, error: "Name, email, and message are required." }, { status: 400 });
        }
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        const PHONE_RE = /^[+\d\s\-(). ]{7,20}$/;
        const URL_RE   = /https?:\/\//i;
        if (!EMAIL_RE.test(email.trim())) {
            return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
        }
        if (phone?.trim() && (!PHONE_RE.test(phone.trim()) || URL_RE.test(phone))) {
            return NextResponse.json({ success: false, error: "Invalid phone number." }, { status: 400 });
        }
        if (URL_RE.test(name) || URL_RE.test(company ?? "")) {
            return NextResponse.json({ success: false, error: "Invalid submission." }, { status: 400 });
        }

        // Save contact message
        await ContactMessage.create({ name, company, phone, email, message, source: source || "contact_form" });

        // Partial (e.g. abandoned signup): capture + alert Michael only — no nurture sequence and
        // no "thanks for contacting" auto-reply (they're mid-signup, not reaching out).
        if (!partial) {
            const existing = await LeadSequence.findOne({ email: email.toLowerCase() });
            if (!existing) {
                await LeadSequence.create({
                    email: email.toLowerCase(),
                    name, company,
                    source: source || "contact_form",
                    step: 0,
                    nextSendAt: new Date(), // send step 0 immediately via cron
                });
            }
        }

        // Fire-and-forget: internal alert always; visitor auto-reply only for real (non-partial) contacts.
        const mails = [sendInternalAlert({ name, email, company, message, source: source || "contact_form" })];
        if (!partial) {
            mails.push(sendEmail({ to: email, subject: SEQUENCE[0].subject, html: SEQUENCE[0].html(name) }));
        }
        Promise.all(mails).catch(e => console.error("[contact email]", e.message));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Contact POST error:", err);
        return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
    }
}
