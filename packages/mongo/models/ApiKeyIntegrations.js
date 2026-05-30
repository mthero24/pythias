import mongoose from "mongoose"
import { PremierPrintingDB } from "../lib/connection";
let schema = new mongoose.Schema({
    displayName: String,
    apiKey: String,
    apiSecret: String,
    organization: String,
    tokenType: String,
    refreshToken: String,
    type: String,
    provider: String,
    userId: String,
    shopId: String,
    shopName: String,
    sellerName: String,
    pullOrdersEnabled: { type: Boolean, default: false },
    sandbox: { type: Boolean, default: false },
})
export default PremierPrintingDB.model("ApiKeyIntegrations", schema);