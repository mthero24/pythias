import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    orderType:    String,
    dateOrdered:  Date,
    dateExpected: Date,
    poNumber:     String,
    vendor:       String,
    received:     { type: Boolean, default: false },
    locations:    [{
        name:     String,
        received: { type: Boolean, default: false },
        items:    [{ inventory: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInventory" }, quantity: Number }],
    }],
    items:        [{ type: mongoose.Schema.Types.ObjectId, ref: "PlatformItem" }],
});

export default PlatformDB.model("PlatformInventoryOrder", schema);
