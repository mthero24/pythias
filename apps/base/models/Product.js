import mongoose from "mongoose";
import Color from "./Color";
import Size from "./Size";
import Style from "./Style";
import Design from "./Design";
const { TSPprints } = require("../lib/connection");

const schema = new mongoose.Schema({
  sku: {type: String, required: true},
  name: { type: String, required: true },
  date: Date,
  tags: [{type:String}],
  department: {type: String},
  styleName: {type: String},
  description: { type: String, required: true },
  design: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: Design
  },
  style: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Style,
  },
  colors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
    },
  ],
  sizes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Size,
    },
  ],
  price: { type: Number, required: true },
  prices: {},
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default TSPprints.model("Product", schema);
