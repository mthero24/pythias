import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";

const schema = new mongoose.Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  images: {
    front: { type: String },
    back: { type: String },
    leftSleeve: { type: String },
    rightSleeve: { type: String },
  },
  stores: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default TSPprints.model("Design", schema);
