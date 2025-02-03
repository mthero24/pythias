import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Color from "./Color";
import Size from "./Size";
import Design from "./Design";
import StyleV2 from "./StyleV2";

const schema = new mongoose.Schema({
  name: {
    type: String
  },
  tags: [{
    type: String
  }],
  styleCode: {
    type: String
  },
  design: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: Design,
    required: true
  },
  style: {
    type: mongoose.Schema.Types.ObjectId,
    ref: StyleV2,
    required: true
  },
  colors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
  }]
});

export default TSPprints.model("ProductV2", schema);
