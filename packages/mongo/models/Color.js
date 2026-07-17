const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: String,
    image: String,
    hexcode: String,
    option_id: Number,
    category: String,
    color_type: String,
    colorFamily: String,
    sku: String,
    nrfColorCode: String,
    colors: [{type: Schema.Types.ObjectId, ref: "Color"}],
    combined: {type: Boolean, default: false}
  },
  { strict: false }
);
export default PremierPrinting.model("Color", SchemaObj, "colors");
