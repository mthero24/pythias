import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema({
    resendId:  { type: String, index: true },     // Resend email_id
    type:      { type: String, index: true },     // email.opened | email.clicked | email.delivered | email.bounced
    email:     { type: String, index: true },     // recipient
    subject:   { type: String, default: "" },
    link:      { type: String, default: "" },     // for email.clicked
    occurredAt:{ type: Date, default: Date.now, index: true },
});

export default Pythias.model("EmailEvent", schema, "email_events");
