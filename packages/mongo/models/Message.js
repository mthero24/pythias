import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    from:    { type: String, required: true },
    to:      { type: String, required: true },
    text:    { type: String, required: true },
    date:    { type: Date, default: Date.now },
    readBy:  [{ type: String }],
});

schema.index({ from: 1, to: 1, date: -1 });
schema.index({ to: 1, readBy: 1 });

export default PremierPrinting.model("Message", schema);
