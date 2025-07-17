const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
  },
  { strict: false }
);
export default PremierPrinting.model("PrintLocations", SchemaObj, "PrintLocations");
