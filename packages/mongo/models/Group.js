import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    name:      { type: String, required: true },
    members:   [{ type: String }],          // userNames
    createdBy: { type: String, required: true },
    avatar:    { type: String },            // color hex or image URL
    createdAt: { type: Date, default: Date.now },
});

schema.index({ members: 1 });

export default PremierPrinting.model("Group", schema);
