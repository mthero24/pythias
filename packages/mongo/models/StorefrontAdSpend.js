import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Ad spend per channel per day — the input that closes the loop (ad spend → revenue → profit).
// Entered manually in v1; later pulled from the Google/Microsoft Ads reporting APIs.
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel:    { type: String, required: true },   // google | microsoft | meta | pinterest | tiktok
    date:       { type: String, required: true },   // YYYY-MM-DD (UTC)
    amountCents:{ type: Number, default: 0 },
    source:     { type: String, default: "manual" },   // manual | google_ads | microsoft_ads
}, { timestamps: true });

schema.index({ orgId: 1, channel: 1, date: 1 });

export default PlatformDB.model("StorefrontAdSpend", schema);
