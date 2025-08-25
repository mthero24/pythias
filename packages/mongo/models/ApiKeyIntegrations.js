import mongoose from "mongoose"
import { PremierPrinting } from "../lib/connection";
let schema = new mongoose.Schema({
    displayName: String,
    apiKey: String,
    apiSecret: String,
    organization: String,
    tokenType: String,
    refreshToken: String,
    type: String,
    provider: String,
})
export default PremierPrinting.model("ApiKeyIntegrations", schema);