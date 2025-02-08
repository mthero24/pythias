import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  batchID: String,
  count: { type: Number },
});

export default TSPprints.model("Batch", schema);
