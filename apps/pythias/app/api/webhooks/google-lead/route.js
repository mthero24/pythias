import { NextResponse } from "next/server";
import { ContactMessage } from "@/models/ContactMessage";

// Google sends a google_key you configure in Google Ads — set GOOGLE_LEAD_WEBHOOK_KEY in .env
const WEBHOOK_KEY = process.env.GOOGLE_LEAD_WEBHOOK_KEY;

// Google identifies fields by column_id, not column_name
function getField(columns, id) {
    return columns?.find((c) => c.column_id === id)?.string_value?.trim() || "";
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Verify the key if one is configured
        if (WEBHOOK_KEY && body.google_key !== WEBHOOK_KEY) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const cols = body.user_column_data || [];

        const firstName = getField(cols, "FIRST_NAME");
        const lastName  = getField(cols, "LAST_NAME");
        const name      = getField(cols, "FULL_NAME") || [firstName, lastName].filter(Boolean).join(" ");
        const email     = getField(cols, "WORK_EMAIL") || getField(cols, "EMAIL");
        const phone     = getField(cols, "WORK_PHONE") || getField(cols, "PHONE_NUMBER");
        const company   = getField(cols, "COMPANY_NAME");

        // Include any extra fields (job title, custom questions, etc.) in the message
        const STANDARD = new Set(["FULL_NAME", "FIRST_NAME", "LAST_NAME", "EMAIL", "WORK_EMAIL", "PHONE_NUMBER", "WORK_PHONE", "COMPANY_NAME"]);
        const extraLines = cols
            .filter((c) => !STANDARD.has(c.column_id) && c.string_value)
            .map((c) => `${c.column_name}: ${c.string_value}`)
            .join("\n");

        const message = [
            "Lead from Google Ads",
            body.campaign_id && `Campaign ID: ${body.campaign_id}`,
            body.adgroup_id  && `Ad Group ID: ${body.adgroup_id}`,
            body.creative_id && `Creative ID: ${body.creative_id}`,
            extraLines,
        ].filter(Boolean).join("\n");

        await ContactMessage.create({
            name:    name || "Google Lead",
            email:   email || "no-email@google-lead.com",
            phone,
            company,
            message,
            source:  "google-lead-form",
            meta: {
                lead_id:     body.lead_id,
                gcl_id:      body.gcl_id,
                campaign_id: body.campaign_id,
                adgroup_id:  body.adgroup_id,
                creative_id: body.creative_id,
                form_id:     body.form_id,
                is_test:     body.is_test,
                api_version: body.api_version,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("Google lead webhook error:", err);
        // Always return 200 so Google doesn't retry indefinitely
        return NextResponse.json({ success: false }, { status: 200 });
    }
}
