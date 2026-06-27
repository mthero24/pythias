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

export async function sendEmail({ to, subject, html, attachments, from, replyTo }) {
    return client().emails.send({ from: from || FROM, to, subject, html, attachments, ...(replyTo ? { replyTo } : {}) });
}

// Personal-feeling sender for the new-signup welcome (replies reach Michael directly).
const WELCOME_FROM = process.env.WELCOME_FROM || "Michael Thero <michaelthero@pythiastechnologies.com>";

function welcomeHtml(firstName, slug) {
    const hi = firstName ? `Hi ${firstName},` : "Hi there,";
    const dash = `https://platform.pythiastechnologies.com/${slug || ""}`;
    return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:8px 4px;font-size:15px;line-height:1.55;">
      <p>${hi}</p>
      <p>Michael here — founder of Pythias. Welcome aboard, and thank you for signing up. I wanted to reach out personally to make sure you get value fast.</p>
      <p>Here's the quickest path to your first win:</p>
      <ol style="padding-left:18px;">
        <li>Log in and connect your store / sales channels</li>
        <li>Your orders start flowing into one production queue</li>
        <li>Shipping labels generate automatically + tracking syncs back</li>
      </ol>
      <p><a href="${dash}" style="display:inline-block;background:#D3A73D;color:#111;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">Open your dashboard &rarr;</a></p>
      <p>And honestly &mdash; I do onboarding myself for new shops. If you'd like, I'll personally walk you through setup so you're not figuring it out alone. Just reply to this email and we'll find 15 minutes.</p>
      <p>Really glad you're here.</p>
      <p>&mdash; Michael<br/>Founder, Pythias Technologies</p>
    </div>`;
}

// New-signup welcome — called fire-and-forget from the registration route.
export async function sendWelcomeEmail({ to, firstName, slug }) {
    return sendEmail({
        to,
        subject: `Welcome to Pythias${firstName ? `, ${firstName}` : ""} 👋`,
        html: welcomeHtml(firstName, slug),
        from: WELCOME_FROM,
        replyTo: WELCOME_FROM,
    });
}
