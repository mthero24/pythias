import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-store cache of the heavy AI demand curve (Chronos sidecar) computed by the daily cron.
// The live demand page reads this for the AI projection and merges it with the fast,
// always-fresh per-product velocity forecast.
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    computedAt: { type: Date, default: Date.now },
    aiCurve:    { type: mongoose.Schema.Types.Mixed },   // { dates:[], units:[], p10:[], p90:[] }
    aiNext30:   { type: Number, default: 0 },             // projected total units next 30 days
    aiNext90:   { type: Number, default: 0 },
}, { timestamps: true });

export default PlatformDB.model("StorefrontDemandCache", schema);
