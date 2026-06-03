import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:  { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    type:   { type: String, required: true },
    name:   { type: String, required: true },
    price:  { type: Number, default: null },
});

schema.index({ orgId: 1, type: 1 });

export default PlatformDB.model("PlatformEditData", schema);
