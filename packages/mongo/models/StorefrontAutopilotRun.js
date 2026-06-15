import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// One record per autopilot run (manual or scheduled). Captures what the AI proposed,
// what it auto-applied (zero-risk actions only, when the seller enabled auto-apply),
// and what is waiting for the seller's one-click review. The seller's dashboard reads
// the latest run; this also gives an audit trail of autonomous changes.

const Rec = new mongoose.Schema({
    title:  { type: String },
    why:    { type: String },
    impact: { type: String },                          // high | medium | low
    action: { type: mongoose.Schema.Types.Mixed },     // {type, params} — see applyAutopilotAction
}, { _id: false });

const Applied = new mongoose.Schema({
    title:   { type: String },
    type:    { type: String },                         // action type
    message: { type: String },                         // human result line from the service
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    trigger: { type: String, enum: ["scheduled", "manual"], default: "scheduled" },
    recommendations: { type: [Rec], default: [] },     // everything proposed this run
    applied: { type: [Applied], default: [] },         // auto-applied (zero-risk) this run
    pending: { type: [Rec], default: [] },             // awaiting seller review
    note:    { type: String, default: "" },            // e.g. "not enough traffic"
}, { timestamps: true });

schema.index({ orgId: 1, createdAt: -1 });

export default PlatformDB.model("StorefrontAutopilotRun", schema);
