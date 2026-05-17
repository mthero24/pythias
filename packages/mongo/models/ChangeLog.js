import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection.js";

const schema = new mongoose.Schema({
    entityType: { type: String, required: true },
    entityId:   { type: String, default: "" },
    entityName: { type: String, default: "" },
    action:     { type: String, required: true },
    userName:   { type: String, default: "" },
    email:      { type: String, default: "" },
    provider:   { type: String, default: "premierPrinting" },
    timestamp:  { type: Date, default: Date.now },
    changes:    [{
        field:  String,
        before: String,
        after:  String,
        _id:    false,
    }],
});

schema.index({ provider: 1, timestamp: -1 });
schema.index({ entityType: 1, entityId: 1 });
schema.index({ userName: 1, timestamp: -1 });

export default PremierPrinting.model("ChangeLog", schema);
