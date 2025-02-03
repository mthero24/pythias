import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Order from "./Order";
import Color from "./Color";
import Size from "./Size";
import Style from "./Style";
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  batchID: String,
  count: { type: Number },
});

export default TSPprints.model("Batch", schema);
