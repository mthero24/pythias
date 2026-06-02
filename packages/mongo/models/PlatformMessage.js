import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    from:     { type: String, required: true },
    to:       { type: String },
    group:    { type: String },
    text:     { type: String, default: "" },
    fileUrl:  { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    date:     { type: Date, default: Date.now },
    readBy:   [{ type: String }],
    reactions: { type: Object, default: {} },
});

schema.index({ orgId: 1, from: 1, to: 1, date: -1 });
schema.index({ orgId: 1, to: 1, readBy: 1 });
schema.index({ orgId: 1, group: 1, date: -1 });

export default PlatformDB.model("PlatformMessage", schema);
