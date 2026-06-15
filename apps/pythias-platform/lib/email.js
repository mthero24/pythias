import { Resend } from "resend";

export const FROM = "Pythias Platform <invoices@pythiastechnologies.com>";

// Lazy — constructing Resend at module load throws when RESEND_API_KEY is unset,
// which breaks `next build` page-data collection for any route that imports this.
// Defer to first use so importing the module is always safe.
let _resend;
function client() {
    if (!_resend) {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

export async function sendEmail({ to, subject, html, attachments }) {
    return client().emails.send({ from: FROM, to, subject, html, attachments });
}
