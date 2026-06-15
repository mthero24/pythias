import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-(org, language, key) translated string for the storefront UI/content. Filled by the
// AI-translate service; read by the storefront's i18n dictionary endpoint. key = a stable
// string id (e.g. a UI key like "cart.checkout" or a content hash).
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    lang:  { type: String, required: true },
    key:   { type: String, required: true },
    value: { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, lang: 1, key: 1 }, { unique: true });

export default PlatformDB.model("StorefrontTranslation", schema);
