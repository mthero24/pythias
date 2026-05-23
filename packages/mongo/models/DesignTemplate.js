import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Blank from "./Blanks";

const customFieldSchema = new mongoose.Schema({
  id:           { type: String, required: true },   // UUID matching fabric obj fieldId
  label:        { type: String, required: true },   // "Recipient Name"
  placeholder:  { type: String, default: "" },
  defaultValue: { type: String, default: "" },      // original text in the design
  maxLength:    { type: Number, default: 50 },
  required:     { type: Boolean, default: false },
}, { _id: false });

const schema = new mongoose.Schema({
  name:               { type: String, required: true },
  provider:           { type: String, default: "premierPrinting" },
  canvasJson:         { type: mongoose.Schema.Types.Mixed, required: true },
  canvasWidth:        { type: Number, default: 480 },
  canvasHeight:       { type: Number, default: 560 },
  customizableFields: [customFieldSchema],
  blanks:             [{ type: mongoose.Schema.Types.ObjectId, ref: Blank }],
  defaultColor:       String,
  printType:          { type: [String], default: ["DTF"] },
  stitchType:         { type: String, default: "satin" },
  category:           String,
  active:             { type: Boolean, default: true },
}, { timestamps: true });

export default PremierPrinting.model("DesignTemplate", schema);
