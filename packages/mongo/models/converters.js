const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    type: String,
    converter: Object,
  },
  { strict: false }
);
export default PremierPrinting.model("Converters", SchemaObj, "converters");
