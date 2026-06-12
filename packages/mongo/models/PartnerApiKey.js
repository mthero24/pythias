import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name:        { type: String, required: true },           // human label e.g. "My Shopify Store"
    keyHash:     { type: String, required: true, index: true }, // bcrypt/sha256 hash — never store plaintext
    keyPrefix:   { type: String, required: true },           // first 8 chars shown in UI for identification
    lastUsedAt:  { type: Date },
    active:      { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ orgId: 1, active: 1 });

export const PartnerApiKey = PlatformDB.model("PartnerApiKey", schema, "partner_api_keys");
