import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
  },
  blank:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blank",
  },
  color: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Color",
  },
  marketPlace: String,
  brand: String,
  type: { type: String,
    enum : ['primary','secondary'],
    default: 'secondary'},
  image: String
});

export default PremierPrinting.model("ProductImages", schema);