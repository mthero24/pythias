import mongoose from "mongoose";
const { PremierPrinting } = require("../lib/connection");

const schema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default PremierPrinting.model("Marketplaces", schema);
