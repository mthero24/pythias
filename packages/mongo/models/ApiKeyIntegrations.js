import mongoose from "mongoose"
import { Pythias } from "../lib/connection";
let schema = new mongoose.Schema({
    displayName: String,
    apiKey: String,
    apiSecret: String,
    organization: String,
    provider: String,
})
export default Pythias.model("ApiKeyIntegrations", schema);