import mongoose from "mongoose";
import Color from "./Color";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  name: {
    type: String
  },
  hexcode: {type: String},
  colors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
    },
  ],
});

export default PremierPrinting.model("ColorGroups", schema);
