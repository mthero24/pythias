import mongoose from "mongoose";
import { cluster1 }  from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
    image: String,
    hexcode: String,
    option_id: Number,
    category: String,
    color_type: String,
  },
  { strict: false }
);
export default cluster1.model("Color", SchemaObj, "colors");
