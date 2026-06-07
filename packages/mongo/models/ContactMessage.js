import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        name:    { type: String, required: true },
        company: { type: String, default: "" },
        phone:   { type: String, default: "" },
        email:   { type: String, required: true },
        message: { type: String, required: true },
        read:    { type: Boolean, default: false },
        source:  { type: String, default: "website" }, // website | google-lead-form
        meta:    { type: mongoose.Schema.Types.Mixed, default: {} },
        notes:   { type: String, default: "" },
    },
    { timestamps: true }
);

schema.index({ createdAt: -1 });
schema.index({ read: 1, createdAt: -1 });

export default Pythias.model("ContactMessage", schema, "contact_messages");
