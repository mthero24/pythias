import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  batchID: String,
  count: { type: Number },
});

export default PremierPrinting.model("Batch", schema);
