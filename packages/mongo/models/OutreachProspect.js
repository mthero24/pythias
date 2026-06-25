import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

// Founder cold-email outreach prospect. One document per email address (email is unique).
// The 5-step sequence is defined in ../lib/outreachSequence.js; `step` is the number of the
// LAST step that has been sent (0 = nothing sent yet), `nextSendAt` is when the next step is due.
const historySchema = new mongoose.Schema(
    {
        step:      { type: Number },
        sentAt:    { type: Date },
        messageId: { type: String, default: "" },
        subject:   { type: String, default: "" },
    },
    { _id: false }
);

const schema = new mongoose.Schema(
    {
        email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
        shopName:  { type: String, default: "" },
        firstName: { type: String, default: "" },
        status:    { type: String, enum: ["active", "replied", "stopped", "unsubscribed", "completed"], default: "active" },
        step:      { type: Number, default: 0 },
        nextSendAt: { type: Date },
        history:   { type: [historySchema], default: [] },
        unsubToken: { type: String, default: "" },
        createdBy: { type: String, default: "" },
    },
    { timestamps: true }
);

// Dispatch query: find active prospects whose next step is due.
schema.index({ status: 1, nextSendAt: 1 });

export default Pythias.model("OutreachProspect", schema, "outreach_prospects");
