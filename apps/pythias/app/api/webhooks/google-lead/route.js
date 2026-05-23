import { NextResponse } from "next/server";
import { ContactMessage } from "@/models/ContactMessage";

// Google sends a google_key you configure in Google Ads — set GOOGLE_LEAD_WEBHOOK_KEY in .env
const WEBHOOK_KEY = process.env.GOOGLE_LEAD_WEBHOOK_KEY;

function getField(columns, name) {
    return columns?.find((c) => c.column_name === name)?.string_value || "";
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Verify the key if one is configured
        if (WEBHOOK_KEY && body.google_key !== WEBHOOK_KEY) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const cols = body.user_column_data || [];

        const name    = getField(cols, "FULL_NAME") || getField(cols, "GIVEN_NAME") + " " + getField(cols, "FAMILY_NAME");
        const email   = getField(cols, "EMAIL") || getField(cols, "WORK_EMAIL");
        const phone   = getField(cols, "PHONE_NUMBER");
        const company = getField(cols, "COMPANY_NAME");

        // Build message from any custom question answers
        const STANDARD = ["FULL_NAME", "GIVEN_NAME", "FAMILY_NAME", "EMAIL", "WORK_EMAIL", "PHONE_NUMBER", "COMPANY_NAME"];
        const customLines = cols
            .filter((c) => !STANDARD.includes(c.column_name))
            .map((c) => `${c.column_name.replace(/_/g, " ")}: ${c.string_value}`)
            .join("\n");

        const message = [
            `Lead from Google Ads`,
            body.campaign_name && `Campaign: ${body.campaign_name}`,
            body.ad_group_name && `Ad Group: ${body.ad_group_name}`,
            customLines,
        ].filter(Boolean).join("\n");

        await ContactMessage.create({
            name:    name.trim() || "Google Lead",
            email:   email || "no-email@google-lead.com",
            phone,
            company,
            message,
            source:  "google-lead-form",
            meta: {
                lead_id:      body.lead_id,
                campaign_id:  body.campaign_id,
                campaign_name: body.campaign_name,
                ad_group_id:  body.ad_group_id,
                ad_group_name: body.ad_group_name,
                ad_id:        body.ad_id,
                form_id:      body.form_id,
                is_test:      body.is_test,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("Google lead webhook error:", err);
        // Still return 200 so Google doesn't retry indefinitely
        return NextResponse.json({ success: false }, { status: 200 });
    }
}
