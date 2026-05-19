import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const SaleSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    name: { type: String, required: true },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    scope: { type: String, enum: ["site", "blank", "design"], required: true },
    newProductsOnly: { type: Boolean, default: false },
    couponCode: { type: String, default: null },
    discountId: { type: String, default: null },
    blankCode: { type: String, default: null },
    blankName: { type: String, default: null },
    colorNames: [String],
    sizeNames: [String],
    designSku: { type: String, default: null },
    designName: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    appliedProducts: [
      {
        productId: String,
        originalVariants: [
          {
            variantId: String,
            originalPrice: String,
            originalCompareAt: { type: String, default: null },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default PremierPrinting.model("Sale", SaleSchema);
