import { Resend } from "resend";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailShell } from "@/emails/Layout";

// Lazy Resend client — never construct at module load (so `next build` doesn't fail when the
// key is missing). Storefront emails are sent from the seller's brand-ish from-address.
let _resend = null;
function resend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    if (!_resend) _resend = new Resend(key);
    return _resend;
}

const DEFAULT_FROM = process.env.STOREFRONT_EMAIL_FROM || "Pythias Stores <stores@pythiastechnologies.com>";

// Legacy div-based shell — kept as a guaranteed fallback if React Email render ever throws,
// so transactional emails (order confirmations etc.) can never silently break.
function legacyTemplate({ brand = "Our Store", title = "", contentHtml = "", footerHtml = "" }) {
    return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
      <div style="padding:20px 24px;border-bottom:1px solid #f0f0f0;font-weight:800;font-size:18px">${brand}</div>
      <div style="padding:24px">
        ${title ? `<h1 style="margin:0 0 12px;font-size:20px">${title}</h1>` : ""}
        ${contentHtml}
      </div>
    </div>
    <div style="text-align:center;color:#94a3b8;font-size:12px;padding:16px 8px;line-height:1.6">
      ${footerHtml || ""}
    </div>
  </div>
</body></html>`;
}

// Polished email shell rendered from the React Email components (table-based, Outlook-safe).
// Stays SYNC (renderToStaticMarkup) so all 16 existing callers are unchanged; falls back to the
// legacy shell if rendering ever fails. `brand` = store name; `footerHtml` carries the unsubscribe link.
export function baseTemplate(props = {}) {
    try {
        return "<!doctype html>" + renderToStaticMarkup(createElement(EmailShell, props));
    } catch (e) {
        console.error("[email] React Email shell render failed — using fallback:", e?.message);
        return legacyTemplate(props);
    }
}

export function btn(href, label) {
    return `<a href="${href}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px">${label}</a>`;
}

// Send a single email. Returns { ok, id } or { ok:false, error }.
export async function sendEmail({ to, subject, html, from }) {
    const client = resend();
    if (!client) return { ok: false, error: "RESEND_API_KEY not set" };
    try {
        const { data, error } = await client.emails.send({ from: from || DEFAULT_FROM, to, subject, html });
        if (error) return { ok: false, error: error.message || String(error) };
        return { ok: true, id: data?.id || null };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// Build a from-address that keeps the VERIFIED sending email but swaps in a store's brand name,
// so each store's emails come from its own name (e.g. "Print Threads <stores@pythiastechnologies.com>").
export function brandedFrom(brandName) {
    if (!brandName) return DEFAULT_FROM;
    const m = DEFAULT_FROM.match(/<([^>]+)>/);
    const email = m ? m[1] : DEFAULT_FROM;
    const safe = String(brandName).replace(/[<>"\r\n]/g, "").trim().slice(0, 60);
    return safe ? `${safe} <${email}>` : DEFAULT_FROM;
}
