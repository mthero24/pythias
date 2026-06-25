// Outreach mailer — renders the personal React Email template and sends one step via Resend.
// Kept separate from lib/email.js (which builds branded HTML for contact/booking flows) because
// outreach must look like a plain personal email, not a marketing template.
//
// Resend client is lazy so `next build` never fails when RESEND_API_KEY is absent.
import { Resend } from "resend";
import { OUTREACH_SEQUENCE, getStep, fillTokens, OUTREACH_LINK } from "@pythias/mongo";

let _resend = null;
function resend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    if (!_resend) _resend = new Resend(key);
    return _resend;
}

export const OUTREACH_FROM =
    process.env.OUTREACH_FROM || "Michael Thero <michaelthero@pythiastechnologies.com>";

// Absolute unsubscribe URL the {{unsub}} token resolves to.
export function unsubscribeUrl(token) {
    const base = process.env.OUTREACH_PUBLIC_BASE || "https://pythiastechnologies.com";
    return `${base}/api/outreach/unsubscribe?token=${encodeURIComponent(token || "")}`;
}

// Render the given step's subject + HTML body for a prospect. Returns { subject, html }.
export async function renderOutreach({ step, firstName, shopName, unsubToken }) {
    const def = getStep(step);
    if (!def) throw new Error(`No outreach step ${step}`);

    const unsub = unsubscribeUrl(unsubToken);
    const tokens = { firstName, shopName, link: OUTREACH_LINK, unsub };
    const subject = fillTokens(def.subject, tokens);
    const body = fillTokens(def.body, tokens);

    // Dynamic import keeps react-dom/server out of the static module graph (Next blocks it).
    const [{ render }, { createElement }, { default: OutreachEmail }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/emails/OutreachEmail"),
    ]);
    const html = await render(createElement(OutreachEmail, { body, unsub }));
    return { subject, html };
}

// Send one step. Returns { ok, id } or { ok:false, error }.
export async function sendOutreachStep({ to, step, firstName, shopName, unsubToken }) {
    const client = resend();
    if (!client) return { ok: false, error: "RESEND_API_KEY not set" };
    try {
        const { subject, html } = await renderOutreach({ step, firstName, shopName, unsubToken });
        const { data, error } = await client.emails.send({
            from: OUTREACH_FROM,
            to,
            subject,
            html,
            replyTo: OUTREACH_FROM,
        });
        if (error) return { ok: false, error: error.message || String(error) };
        return { ok: true, id: data?.id || null, subject };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

export { OUTREACH_SEQUENCE };
