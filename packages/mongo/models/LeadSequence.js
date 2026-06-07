import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema({
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:        { type: String, default: "" },
    company:     { type: String, default: "" },
    source:      { type: String, default: "contact_form" }, // contact_form | lead_capture | demo_booking
    step:        { type: Number, default: 0 },   // which email in the sequence has been sent (0 = none yet)
    nextSendAt:  { type: Date },                 // when to send the next email
    lastSentAt:  { type: Date },
    completed:   { type: Boolean, default: false },
    unsubscribed:{ type: Boolean, default: false },
    paused:      { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ nextSendAt: 1, completed: 1, unsubscribed: 1 });

export default Pythias.model("LeadSequence", schema, "lead_sequences");
