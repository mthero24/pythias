import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:        String,
    image:       String,
    hexcode:     String,
    category:    String,
    color_type:  String,
    colorFamily: String,
    sku:         String,
    colors:      [{ type: mongoose.Schema.Types.ObjectId, ref: "PlatformColor" }],
    combined:    { type: Boolean, default: false },
});

schema.index({ orgId: 1, name: 1 });

export default PlatformDB.model("PlatformColor", schema);
