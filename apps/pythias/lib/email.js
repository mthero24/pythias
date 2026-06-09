import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Pythias Technologies <info@pythiastechnologies.com>";
const BRAND_COLOR = "#D3A73D";

function baseTemplate(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#111827;padding:28px 40px;text-align:center;">
          <span style="color:${BRAND_COLOR};font-size:22px;font-weight:700;letter-spacing:-.5px;">Pythias Technologies</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f4f4f5;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            Pythias Technologies · 1421 Hidden View Drive, Lapeer MI 48446<br>
            <a href="https://pythiastechnologies.com" style="color:#9ca3af;">pythiastechnologies.com</a>
            &nbsp;·&nbsp;
            <a href="https://pythiastechnologies.com/unsubscribe?email={{EMAIL}}" style="color:#9ca3af;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text, url) {
    return `<a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#111;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;">${text}</a>`;
}

// ── Sequence steps ────────────────────────────────────────────────────────────
// Each step: { subject, delayDays, html(name) }

export const SEQUENCE = [
    {
        subject: "Thanks for reaching out — here's what happens next",
        delayDays: 0,
        html: (name) => baseTemplate(`
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;">Hi ${name || "there"},</h2>
            <p style="color:#374151;line-height:1.7;">Thanks for getting in touch with Pythias Technologies. We've received your message and one of our team members will be in contact within 1 business day.</p>
            <p style="color:#374151;line-height:1.7;">In the meantime, here's a quick look at what we do:</p>
            <ul style="color:#374151;line-height:2;padding-left:20px;">
              <li>Fulfillment automation for print-on-demand businesses</li>
              <li>18+ marketplace integrations (Amazon, Walmart, TikTok, Etsy, and more)</li>
              <li>Real-time inventory, shipping, and production management</li>
              <li>Onboarding in under 2 weeks</li>
            </ul>
            <p style="margin-top:28px;text-align:center;">${btn("Book a Live Demo", "https://pythiastechnologies.com/#calendar-booking-section")}</p>
            <p style="color:#6b7280;font-size:13px;margin-top:28px;">Questions? Reply to this email or call us at (844) 579-8442.</p>
        `),
    },
    {
        subject: "How Pythias works — a 2-minute overview",
        delayDays: 3,
        html: (name) => baseTemplate(`
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;">Hi ${name || "there"},</h2>
            <p style="color:#374151;line-height:1.7;">We wanted to share a quick overview of how Pythias Fulfillment Cloud works — from order intake to final delivery — so you can see if it's the right fit for your operation.</p>
            <h3 style="color:#111827;">The core workflow</h3>
            <ol style="color:#374151;line-height:2;padding-left:20px;">
              <li><strong>Orders in</strong> — Pythias pulls orders from every marketplace automatically (ShipStation, TikTok, Etsy, Walmart, and more).</li>
              <li><strong>Production assigned</strong> — Items are routed to the correct production stage with label printing, DTF management, and inventory tracking built in.</li>
              <li><strong>Shipped out</strong> — Tracking is pushed back to every marketplace automatically when an order ships.</li>
            </ol>
            <p style="color:#374151;line-height:1.7;">No manual data entry. No spreadsheets. No missed orders.</p>
            <p style="color:#374151;line-height:1.7;">Want to see it with your own orders? <a href="https://pythiastechnologies.com/#calendar-booking-section" style="color:#D3A73D;font-weight:700;">Grab a time on our calendar</a> and we'll walk through your exact workflow.</p>
            <p style="margin-top:28px;text-align:center;">${btn("Book a Time →", "https://pythiastechnologies.com/#calendar-booking-section")}</p>
        `),
    },
    {
        subject: "What does Pythias actually cost?",
        delayDays: 7,
        html: (name) => baseTemplate(`
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;">Hi ${name || "there"},</h2>
            <p style="color:#374151;line-height:1.7;">One of the first questions we get is about pricing — so here's a straight answer.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">Starter</td>
                <td style="padding:12px 16px;color:#374151;border:1px solid #e5e7eb;">Up to 1,000 orders/month</td>
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">$199/mo</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">Scale</td>
                <td style="padding:12px 16px;color:#374151;border:1px solid #e5e7eb;">Up to 15,000 orders/month</td>
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">$3,000/mo</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">Enterprise</td>
                <td style="padding:12px 16px;color:#374151;border:1px solid #e5e7eb;">Unlimited + dedicated support</td>
                <td style="padding:12px 16px;font-weight:700;color:#111827;border:1px solid #e5e7eb;">$5,500/mo</td>
              </tr>
            </table>
            <p style="color:#374151;line-height:1.7;">All plans include full marketplace integrations, production management, and onboarding. No per-order fees.</p>
            <p style="color:#374151;line-height:1.7;">Questions about which plan fits your volume? <a href="https://pythiastechnologies.com/#calendar-booking-section" style="color:#D3A73D;font-weight:700;">Pick a time on our calendar</a> — we'll answer everything in 20 minutes.</p>
            <p style="margin-top:28px;text-align:center;">${btn("Book a Pricing Call", "https://pythiastechnologies.com/#calendar-booking-section")}</p>
        `),
    },
    {
        subject: "Still thinking it over? Let's make it easy.",
        delayDays: 14,
        html: (name) => baseTemplate(`
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;">Hi ${name || "there"},</h2>
            <p style="color:#374151;line-height:1.7;">We know evaluating a new platform takes time — there's a lot to consider. If you have questions we haven't answered yet, just reply to this email and we'll get back to you the same day.</p>
            <p style="color:#374151;line-height:1.7;">If you're ready to see Pythias in action, a 30-minute live demo is the fastest way to know if it's the right fit. We'll walk through your specific operation, not a generic slide deck.</p>
            <p style="margin-top:28px;text-align:center;">${btn("Book Your Free Demo", "https://pythiastechnologies.com/#calendar-booking-section")}</p>
            <p style="color:#6b7280;font-size:13px;margin-top:28px;">This is the last email in this series. We won't follow up again unless you reach out — but we're always here at <a href="mailto:info@pythiastechnologies.com" style="color:#D3A73D;">info@pythiastechnologies.com</a>.</p>
        `),
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

export async function sendEmail({ to, subject, html }) {
    await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendInternalAlert({ name, email, company, message, source }) {
    const html = baseTemplate(`
        <h2 style="margin:0 0 12px;color:#111827;">New lead — ${source}</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;font-weight:700;color:#374151;width:120px;">Name</td><td style="padding:8px;color:#374151;">${name}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:700;color:#374151;">Email</td><td style="padding:8px;"><a href="mailto:${email}" style="color:#D3A73D;">${email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#374151;">Company</td><td style="padding:8px;color:#374151;">${company || "—"}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:700;color:#374151;">Message</td><td style="padding:8px;color:#374151;white-space:pre-wrap;">${message}</td></tr>
        </table>
    `);
    await sendEmail({ to: process.env.ALERT_EMAIL || "info@pythiastechnologies.com", subject: `New lead: ${name} <${email}>`, html });
}

// ── Demo booking emails ────────────────────────────────────────────────────────

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatBookingDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return `${DAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${d}, ${y}`;
}

function formatBookingTime(time24) {
    const [h, mn] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(mn).padStart(2, "0")} ${ampm}`;
}

export function sendBookingConfirmation({ to, name, date, startTime, meetLink }) {
    const dateDisplay = formatBookingDate(date);
    const timeDisplay = formatBookingTime(startTime);
    const meetSection = meetLink
        ? `<p style="margin-top:28px;text-align:center;">${btn("Join Google Meet →", meetLink)}</p>
           <p style="color:#6b7280;font-size:13px;margin-top:8px;text-align:center;">Save this link — you'll use it to join your demo.</p>`
        : `<p style="color:#374151;line-height:1.7;">We'll send your Google Meet link shortly before your demo.</p>`;

    const html = baseTemplate(`
        <h2 style="margin:0 0 16px;color:#111827;font-size:24px;">You're booked, ${name || "there"}!</h2>
        <p style="color:#374151;line-height:1.7;">Your Pythias Technologies demo is confirmed. Here are your details:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f9fafb;">
            <td style="padding:12px 16px;font-weight:700;color:#374151;width:100px;border:1px solid #e5e7eb;">Date</td>
            <td style="padding:12px 16px;color:#111827;border:1px solid #e5e7eb;">${dateDisplay}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb;">Time</td>
            <td style="padding:12px 16px;color:#111827;border:1px solid #e5e7eb;">${timeDisplay} Eastern Time</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb;">Duration</td>
            <td style="padding:12px 16px;color:#111827;border:1px solid #e5e7eb;">30 minutes</td>
          </tr>
        </table>
        ${meetSection}
        <p style="color:#374151;line-height:1.7;margin-top:24px;">During the demo we'll walk through your exact workflow — not a generic slide deck. Come with questions.</p>
        <p style="color:#6b7280;font-size:13px;margin-top:28px;">Need to reschedule? Reply to this email or call (844) 579-8442.</p>
    `);

    return sendEmail({ to, subject: `Your Pythias demo — ${dateDisplay} at ${timeDisplay} ET`, html });
}

export function sendBookingInternalAlert({ name, email, company, phone, date, startTime, meetLink }) {
    const dateDisplay = formatBookingDate(date);
    const timeDisplay = formatBookingTime(startTime);
    const html = baseTemplate(`
        <h2 style="margin:0 0 12px;color:#111827;">New demo booking</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;font-weight:700;color:#374151;width:120px;">Name</td><td style="padding:8px;color:#374151;">${name}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:700;color:#374151;">Email</td><td style="padding:8px;"><a href="mailto:${email}" style="color:#D3A73D;">${email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#374151;">Company</td><td style="padding:8px;color:#374151;">${company || "—"}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:700;color:#374151;">Phone</td><td style="padding:8px;color:#374151;">${phone || "—"}</td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#374151;">Date</td><td style="padding:8px;color:#374151;">${dateDisplay}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:700;color:#374151;">Time</td><td style="padding:8px;color:#374151;">${timeDisplay} ET</td></tr>
          ${meetLink ? `<tr><td style="padding:8px;font-weight:700;color:#374151;">Meet</td><td style="padding:8px;"><a href="${meetLink}" style="color:#D3A73D;">${meetLink}</a></td></tr>` : ""}
        </table>
    `);
    return sendEmail({
        to:      process.env.ALERT_EMAIL || "info@pythiastechnologies.com",
        subject: `Demo booked: ${name}${company ? ` (${company})` : ""} — ${dateDisplay} ${timeDisplay}`,
        html,
    });
}

// Schedule the first send immediately, subsequent ones at delay offsets
export function nextSendDate(step) {
    const days = SEQUENCE[step]?.delayDays ?? 0;
    const d = new Date();
    d.setDate(d.getDate() + days);
    // Send at 10am EST
    d.setUTCHours(15, 0, 0, 0);
    return d;
}
