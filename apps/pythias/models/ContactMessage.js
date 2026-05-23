import mongoose from "mongoose";
import { PremierPrinting } from "@/lib/connection";

const ContactMessageSchema = new mongoose.Schema(
    {
        name:    { type: String, required: true },
        company: { type: String, default: "" },
        phone:   { type: String, default: "" },
        email:   { type: String, required: true },
        message: { type: String, required: true },
        read:    { type: Boolean, default: false },
        source:  { type: String, default: "website" }, // website | google-lead-form
        meta:    { type: mongoose.Schema.Types.Mixed, default: {} }, // raw google payload fields
    },
    { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ read: 1, createdAt: -1 });

export const ContactMessage = PremierPrinting.model("ContactMessage", ContactMessageSchema, "contact_messages");
