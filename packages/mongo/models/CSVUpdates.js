import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  date: Date,
  infoGathered: {type: Boolean, default: false},
  dataParsed: {type: Boolean, default: false},
  csvReady: {type: Boolean, default: false},
  active: {type: Boolean, default: false},
  error: {type: Boolean, default: false},
  files: Object
});

export default PremierPrinting.model("CSVUpdates", schema);
