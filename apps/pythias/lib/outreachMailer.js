// Outreach mailer — builds a plain, personal HTML email (matches Pythias's own lib/email.js style;
// no React Email dependency) and sends one step via Resend. It must look like Michael typed it in his
// own client — left-aligned, system font, no marketing header — not a branded template.
//
// Resend client is lazy so `next build` never fails when RESEND_API_KEY is absent.
import { Resend } from "resend";
import { OUTREACH_SEQUENCE, getStep, fillTokens, OUTREACH_LINK } from "@pythias/mongo";

const MAILING_ADDRESS =
    process.env.OUTREACH_MAILING_ADDRESS ||
    "Pythias Technologies · 1421 Hidden View Drive, Lapeer, MI 48446";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Make bare http(s) URLs clickable while keeping the plain look.
const linkify = (s) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1a56db;text-decoration:underline;">$1</a>');

// Plain personal HTML from the already-token-filled body + absolute unsubscribe URL. CAN-SPAM footer
// (unsubscribe + physical mailing address) on every send.
function outreachHtml(body, unsub) {
    const P = "font-size:15px;line-height:1.55;color:#222;margin:0 0 14px;text-align:left;white-space:pre-wrap;";
    const F = "font-size:11px;line-height:1.5;color:#999;margin:0 0 6px;text-align:left;";
    const paras = String(body)
        .split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
        .map((p) => `<p style="${P}">${linkify(esc(p))}</p>`).join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"></head>` +
        `<body style="background:#fff;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222;">` +
        `<div style="max-width:560px;margin:0 auto;padding:16px;">${paras}` +
        `<hr style="border:none;border-top:1px solid #eee;margin:22px 0 12px;">` +
        `<p style="${F}">You're receiving this because I thought Pythias might genuinely help your shop. ` +
        `If you'd rather not hear from me, <a href="${esc(unsub)}" style="color:#999;text-decoration:underline;">unsubscribe here</a>.</p>` +
        `<p style="${F}">${esc(MAILING_ADDRESS)}</p></div></body></html>`;
}

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
    return { subject, html: outreachHtml(body, unsub) };
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
