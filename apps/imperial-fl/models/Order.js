import mongoose from "mongoose";
const { PremierPrinting } = require("../lib/connection");
import Item from "./Items"
import brand from "./Brands"
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  total: Number,
  status: {
    type: String,
    required: true,
  },
  poNumber: {
    type: String,
    required: true,
  },
  kohlsId: String,
  sheinId: String,
  uniquePo: {type: String},
  orderKey: String,
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Item,
    },
  ],
  shippingAddress: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    address1: {
      type: String,
      required: true,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
    },
  },
  shippingType: {
    type: String,
    required: true,
  },
  marketplace: { type: String },
  brand:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: brand,
  },
  brandName: "String",
  marketplaceOrderId: { type: String, },
  error: { type: String },
  shippingRates: {
    firstClassRate: Number,
    priorityRate: Number,
    mailInnovations: Number,
    upsGround: Number,
    USPSFlatRate: Number,
    smartPostRate: Number,
    fedExGround: Number,
    FedExHome: Number,
    FedExOneRate: Number,
    fedExOneRateNextDay: Number,
    FedEx2ndDay: Number,
    FedExNextDay: Number,
    ups3day: Number,
    ups2ndDayAir: Number,
    upsNextDayAir: Number,
    upsNextDayAirSaver: Number,
  },
  selectedShipping: {
    provider: String,
    service: String,
    subService: String,
    packaging: String,
    cost: Number,
  },
  preShipped: { type: Boolean, default: false },
  shippingInfo: {
    label: String,
    labels: [
      {
        trackingNumber: String,
        label: String,
        cost: Number,
        trackingInfo: [String],
        delivered: { type: Boolean, default: false },
        provider: String
      },
    ],
    shippingCost: { type: Number, default: 0 },
  },
  notes: [
    {
      note: String,
      date: Date,
    },
  ],
  transactionId: String,
  refunded: { type: Boolean, default: false },
  canceled: { type: Boolean, default: false },
  isStoreSale: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  storeSale: {
    productTotal: Number,
    shippingCharge: Number,
    taxCharge: Number,
    discountUsed: String,
    discount: Number,
    adminDiscount: Number,
    billingAddress: {
      name: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      country: String,
      email: String,
    },
    paidToStore: { type: Boolean, default: false },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    fees: {
      processingFee: Number,
      transactionFee: Number,
      productCost: Number,
      shippingFee: Number,
    },
  },
  new: { type: Boolean, default: true },
  archived: { type: Boolean, default: false },
  finalized: { type: Boolean, default: false },
  pricingChanges: { type: Number, default: 0 },
});

// schema.pre("save", async function (next) {
//   if (this.isNew) {
//     const existingModel = await this.constructor.findOne({ uniquePo: this.uniquePo, }).select('_id').lean();
//     if (existingModel) {
//       throw new Error("uniquePo must be unique");
//     }
//   }
//   next();
// });

export default PremierPrinting.model("Order", schema);
