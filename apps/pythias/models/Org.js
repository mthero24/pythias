import mongoose from "mongoose";
import { PremierPrinting } from "@/lib/connection";

const schema = new mongoose.Schema({ founder: Boolean }, { strict: false });

export const FounderOrg = PremierPrinting.models.FounderOrg || PremierPrinting.model("FounderOrg", schema, "organizations");
