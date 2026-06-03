import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const messageSchema = new mongoose.Schema({
    body:        { type: String, required: true },
    authorName:  { type: String, required: true },
    authorType:  { type: String, enum: ["user", "staff"], default: "user" },
    createdAt:   { type: Date, default: Date.now },
}, { _id: true });

const schema = new mongoose.Schema({
    orgId:            { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    ticketNumber:     { type: String, required: true },
    subject:          { type: String, required: true },
    type:             { type: String, enum: ["request", "issue"], required: true },
    priority:         { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    status:           { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open" },
    createdByUserId:  { type: mongoose.Schema.Types.ObjectId, ref: "PlatformUser" },
    createdByName:    { type: String },
    messages:         [messageSchema],
}, { timestamps: true });

schema.index({ orgId: 1, status: 1, createdAt: -1 });
schema.index({ orgId: 1, type: 1, createdAt: -1 });
schema.index({ ticketNumber: 1 }, { unique: true });

export default PlatformDB.model("SupportTicket", schema);
