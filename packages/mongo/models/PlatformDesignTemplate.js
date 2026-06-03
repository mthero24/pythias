import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const customFieldSchema = new mongoose.Schema({
    id:           { type: String, required: true },
    label:        { type: String, required: true },
    placeholder:  { type: String, default: "" },
    defaultValue: { type: String, default: "" },
    maxLength:    { type: Number, default: 50 },
    required:     { type: Boolean, default: false },
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:              { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:               { type: String, required: true },
    canvasJson:         { type: mongoose.Schema.Types.Mixed, required: true },
    canvasWidth:        { type: Number, default: 480 },
    canvasHeight:       { type: Number, default: 560 },
    customizableFields: [customFieldSchema],
    blanks:             [{ type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" }],
    defaultColor:       String,
    printType:          { type: [String], default: ["DTF"] },
    stitchType:         { type: String, default: "satin" },
    category:           String,
    active:             { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ orgId: 1, name: 1 });

export default PlatformDB.model("PlatformDesignTemplate", schema);
