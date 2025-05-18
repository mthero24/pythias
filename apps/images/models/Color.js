import mongoose from "mongoose";
import{ PremierPrinting } from "../lib/connection.js";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
    image: String,
    hexcode: String,
    option_id: Number,
    category: String,
    color_type: String,
    colorFamily: String
  },
  { strict: false }
);
export default PremierPrinting.model("Color", SchemaObj, "colors");
