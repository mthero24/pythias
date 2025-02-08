import mongoose from "mongoose";
import { TSPprints } from "../lib/connection";

const schema = new mongoose.Schema({
  styleCode: {
    type: String,
    required: true,
  },
  sizeName: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
});

export default TSPprints.model("ShippingWeights", schema);
