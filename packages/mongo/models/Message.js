import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    from:     { type: String, required: true },
    to:       { type: String },           // set for DMs, absent for group msgs
    group:    { type: String },           // set for group msgs
    text:     { type: String, default: "" },
    fileUrl:  { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    date:     { type: Date, default: Date.now },
    readBy:   [{ type: String }],
    reactions: { type: Object, default: {} },   // { "👍": ["user1", "user2"], ... }
});

schema.index({ from: 1, to: 1, date: -1 });
schema.index({ to: 1, readBy: 1 });
schema.index({ group: 1, date: -1 });
schema.index({ text: "text" });

export default PremierPrinting.model("Message", schema);
