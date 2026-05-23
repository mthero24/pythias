import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true, index: true },
  pages:      { type: [String], default: [] },
  entryPage:  String,
  startedAt:  { type: Date, default: Date.now },
  lastSeen:   { type: Date, default: Date.now },
  source:     { type: String, default: "direct" },
  medium:     String,
  campaign:   String,
  referrer:   String,
  userName:   String, // set if the anonymous session later logs in
}, { timestamps: false });

// Auto-delete sessions inactive for 2 hours
schema.index({ lastSeen: 1 }, { expireAfterSeconds: 7200 });

export default PremierPrinting.model("ActiveSession", schema);
