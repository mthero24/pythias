// Lightweight ops alert to the Pythias super-admins (PYTHIAS_ADMIN_EMAILS) via Resend.
// Lazy + never throws — safe to call from order/cron paths. Mirrors apps/pythias-platform/lib/email.js.

const FROM = "Pythias Platform <invoices@pythiastechnologies.com>";
let _resend;

function admins() {
    return (process.env.PYTHIAS_ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function sendAdminAlert({ subject, html }) {
    try {
        const to = admins();
        if (!to.length || !process.env.RESEND_API_KEY) return false;
        if (!_resend) {
            const { Resend } = await import("resend");
            _resend = new Resend(process.env.RESEND_API_KEY);
        }
        await _resend.emails.send({ from: FROM, to, subject, html });
        return true;
    } catch (e) {
        console.error("[adminAlert] failed:", e?.message);
        return false;
    }
}
