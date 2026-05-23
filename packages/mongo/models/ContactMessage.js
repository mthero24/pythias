import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  name:    { type: String, required: true },
  company: String,
  phone:   String,
  email:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

export default PremierPrinting.model("ContactMessage", schema);
