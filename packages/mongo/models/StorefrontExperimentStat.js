import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-(experiment, variant) tally: exposures (visitors bucketed) + conversions (purchases).
const schema = new mongoose.Schema({
    orgId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    experimentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    variant:      { type: String, required: true },
    exposures:    { type: Number, default: 0 },
    conversions:  { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ orgId: 1, experimentId: 1, variant: 1 }, { unique: true });

export default PlatformDB.model("StorefrontExperimentStat", schema);
