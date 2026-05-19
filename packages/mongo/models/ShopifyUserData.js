import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// Mirrors pythias-app's UserData collection — used by provider apps to obtain
// the Shopify access token for API calls on behalf of connected stores.
const schema = new mongoose.Schema({
  shop: { type: String, index: true },
  token: String,          // Shopify Admin API access token
  provider: String,
  pythiasToken: String,   // matches ApiKeyIntegrations.apiKey
  providerToken: String,
  autoImportOrders: { type: Boolean, default: false },
}, { collection: "userdatas" });

export default PremierPrinting.model("ShopifyUserData", schema);
