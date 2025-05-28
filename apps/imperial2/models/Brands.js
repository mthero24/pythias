import mongoose from "mongoose";
const { PremierPrinting } = require("../lib/connection");
import MarketPlaces from "./MarketPlaces"

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: String,
  marketPlaces: [{
    keys: Object,
    marketplace:{type: mongoose.Schema.Types.ObjectId,
        ref: MarketPlaces}
  }]
});

export default PremierPrinting.model("Brands", schema);
