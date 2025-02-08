import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Color from "./Color";
import Size from "./Size";
import Style from "./Style";
import Item from "./Items";
import Store from "./Store";
import Product from "./Product";

const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  userEmail: {
    type: String,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Initializing",
      "Received",
      "Failed",
      "Processing",
      "Shipped",
      "shipped",
      "Delivered",
      "Complete",
      "Canceled",
      "Payment Failed",
      "Out For Delivery"
    ],
  },
  poNumber: {
    type: String,
    required: true,
  },
  uniquePo: {
    type: String,
    unique: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
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
  productCost: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    required: true,
  },
  taxCost: {
    type: Number,
    required: true,
  },
  shippingType: {
    type: String,
    required: true,
  },
  marketplace: { type: String },
  marketplaceOrderId: { type: String, unique: true, sparse: true },
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
        delivered: { type: Boolean, default: false }
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

export default TSPprints.model("Order", schema);
