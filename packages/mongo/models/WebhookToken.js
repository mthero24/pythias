import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        name:        { type: String, required: true },
        token:       { type: String, required: true, unique: true },
        type:        { type: String, default: "articles" },
        active:      { type: Boolean, default: true },
        lastUsedAt:  { type: Date, default: null },
        createdBy:   { type: String, default: "" },
    },
    { timestamps: true }
);

schema.index({ token: 1 });
schema.index({ type: 1, active: 1 });

export default Pythias.model("WebhookToken", schema, "webhook_tokens");
