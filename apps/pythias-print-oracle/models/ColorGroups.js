import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Color from "./Color";

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

export default TSPprints.model("ColorGroups", schema);
