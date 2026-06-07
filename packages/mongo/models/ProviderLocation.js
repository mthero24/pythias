import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Where a provider ships from. A provider can have multiple locations.
// Used by the routing engine for geography scoring.
const schema = new mongoose.Schema({
    providerId:       { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    isPrimary:        { type: Boolean, default: false },
    zip:              { type: String },
    state:            { type: String },
    // "northeast" | "southeast" | "midwest" | "west" | "southwest"
    region:           { type: String, enum: ["northeast", "southeast", "midwest", "west", "southwest"] },
    country:          { type: String, default: "US" },          // ISO 3166-1 alpha-2
    // Empty array = ships everywhere; non-empty = restricted to listed countries
    shipsToCountries: [{ type: String }],
}, { timestamps: true });

schema.index({ providerId: 1, isPrimary: 1 });

export default PlatformDB.model("ProviderLocation", schema);
