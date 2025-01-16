const { TSPprints } = require("../lib/connection");
let mongoose = require("mongoose");
var schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number },
  quantityDiscounts: [
    {
      quantity: Number,
      discount: Number,
    },
  ],
  additionalPrintArea: {
    price: Number,
    quantityDiscounts: [
      {
        quantity: Number,
        discount: Number,
      },
    ],
  },
});
module.exports = TSPprints.model("PrintTypes", schema);
