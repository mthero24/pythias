import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Reliability metrics per provider, recalculated nightly.
// Feeds the reliability scoring step of the routing engine (0–30 pts).
const schema = new mongoose.Schema({
    providerId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    // Rolling 30-day metrics (recalculated nightly by a background job)
    onTimeRate30d:   { type: Number, default: 1.0 },   // 0.0–1.0 — % shipped within leadTimeDays
    defectRate30d:   { type: Number, default: 0.0 },   // 0.0–1.0 — % with replacement or refund
    avgShipDays30d:  { type: Number, default: 3 },     // actual average days to ship
    totalFulfilled:  { type: Number, default: 0 },     // lifetime fulfilled order count
    // Composite score 0–100, recalculated nightly
    // New providers in warmupMode are capped at 50 regardless of raw score
    score:           { type: Number, default: 50 },
    lastCalculated:  { type: Date },
}, { timestamps: true });

export default PlatformDB.model("ProviderScore", schema);
