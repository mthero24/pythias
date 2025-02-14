import mongoose from "mongoose";
const { PremierPrinting } = require("../lib/connection");

const schema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  images: {
    front: { type: String },
    back: { type: String },
    leftSleeve: { type: String },
    rightSleeve: { type: String },
  },
  embroideryFiles: {
    front: { type: String },
    back: { type: String },
    leftSleeve: { type: String },
    rightSleeve: { type: String },
  },
  blanks: [{
    blank:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blank",
    },
    brands: [String],
    marketPlaces: [String]
  }],
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brands",
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default PremierPrinting.model("Design", schema);
