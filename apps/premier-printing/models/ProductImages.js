import mongoose from "mongoose";
const { PremierPrinting } = require("../lib/connection");

const schema = new mongoose.Schema({
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
  },
  blank:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blank",
  },
  color: String,
  mockup: String,
  images: {
    front: { type: String },
    back: { type: String },
    leftSleeve: { type: String },
    rightSleeve: { type: String },
  },
});

export default PremierPrinting.model("ProductImages", schema);