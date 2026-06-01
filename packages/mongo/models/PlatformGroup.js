import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, required: true },
    name:      { type: String, required: true },
    members:   [{ type: String }],
    createdBy: { type: String, required: true },
    avatar:    { type: String },
    createdAt: { type: Date, default: Date.now },
});

schema.index({ orgId: 1, members: 1 });

export default PlatformDB.model("PlatformGroup", schema);
