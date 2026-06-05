import { NextResponse } from "next/server";
import { ContactMessage } from "@pythias/mongo";

export async function POST(req) {
    try {
        const { name, email, company, orderVolume, challenges } = await req.json();
        if (!email?.trim()) return NextResponse.json({ success: false });

        await ContactMessage.findOneAndUpdate(
            { email: email.trim().toLowerCase(), source: "lead_capture_partial" },
            {
                $set: {
                    name:    name?.trim() || "Unknown",
                    email:   email.trim().toLowerCase(),
                    company: company?.trim() || "",
                    message: "Partial form — visitor did not submit.",
                    source:  "lead_capture_partial",
                    meta: {
                        orderVolume:   orderVolume || null,
                        challenges:    challenges  || null,
                        partialSavedAt: new Date(),
                    },
                },
                $setOnInsert: { read: false },
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[contact/partial]", e);
        return NextResponse.json({ success: false });
    }
}
