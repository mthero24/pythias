import mongoose from "mongoose";
import { TSPprints } from "../lib/connection";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {type: Number, required: true},
  type: {type: String},
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  posTransAction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PosTransaction",
  },
});

export default TSPprints.model("StoreMoney", schema);
