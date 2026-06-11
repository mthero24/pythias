import { Resend } from "resend";

export const FROM = "Premier Printing <invoices@pythiastechnologies.com>";

export async function sendEmail({ to, subject, html, attachments }) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({ from: FROM, to, subject, html, attachments });
}
