import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default PremierPrinting.model("Marketplaces", schema);
