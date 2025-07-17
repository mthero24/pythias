const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
    image: String,
    hexcode: String,
    option_id: Number,
    category: String,
    color_type: String,
    colorFamily: String,
    sku: String,
  },
  { strict: false }
);
export default PremierPrinting.model("Color", SchemaObj, "colors");
