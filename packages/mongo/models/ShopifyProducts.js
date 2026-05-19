import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// Mirrors pythias-app's Products model — documents written when provider apps
// push products through the webhook sync flow to Shopify. Same collection as
// the monorepo Products model; this schema exposes the Shopify-specific fields.
const schema = new mongoose.Schema({
  shop: { type: String, index: true },
  provider: String,
  sku: String,
  shopifyProduct: {
    productId: String,
    variantIds: [Object],
    imageIds: [String],
    published: { type: Boolean, default: false },
  },
  providerProduct: Object,
}, { collection: "products" });

export default PremierPrinting.model("ShopifyProducts", schema);
