import { NextResponse } from "next/server";

// Abandoned-signup capture. The register page fires this the moment a visitor enters a valid
// email (before they finish). We forward it server-to-server (no CORS) to the marketing
// /api/contact in `partial` mode — it lands in Contact Messages + alerts Michael, but does NOT
// send the visitor a "thanks for contacting" auto-reply or start a nurture sequence, since they
// may still complete the signup. A real abandoner becomes a lead Michael can chase personally.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TARGET = process.env.MARKETING_CONTACT_URL || "https://pythiastechnologies.com/api/contact";

export async function POST(req) {
    try {
        const { email, plan, type } = await req.json();
        if (!email || !EMAIL_RE.test(String(email).trim())) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }
        const detail = type ? ` (${type}${plan ? `/${plan}` : ""})` : "";
        await fetch(TARGET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: email,
                email,
                message: `Abandoned signup — started registering${detail} but hasn't finished. Reach out?`,
                source: "register_abandoned",
                partial: true,
            }),
        }).catch(() => {});
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
