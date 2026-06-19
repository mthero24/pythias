import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Item from "./Items"
import brand from "./Brands"
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
  date: {
    type: Date,
    default: new Date(),
  },
  bulk: { type: Boolean, default: false },
  total: Number,
  productCost: Number,
  shippingCost: Number,
  discountAmount: { type: Number, default: 0 },
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
  // Return/from address for the label. Set for Commerce Cloud orders so the
  // provider ships blind under the seller's brand (not the provider's).
  returnAddress: {
    name:         String,
    businessName: String,
    address:      String,
    address2:     String,
    city:         String,
    state:        String,
    postalCode:   String,
    country:      String,
  },
  marketplace: { type: String },
  brand:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: brand,
  },
  brandName: "String",
  marketplaceOrderId: { type: String },
  marketplaceConnectionId: { type: mongoose.Schema.Types.ObjectId },
  marketplaceShipped: { type: Boolean, default: false },
  ebayLineItemIds: [String],
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
        provider: String,
        expectedDelivery: Date,
      },
    ],
    shippingCost: { type: Number, default: 0 },
    shippedAt: { type: Date },
  },
  notes: [
    {
      note: String,
      date: Date,
      userName: String
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
  shopifyOrderId: { type: String, unique: true, sparse: true },
  shopifyShop: { type: String, sparse: true },
  shipByDate: { type: Date },
  discountName: { type: String },
  customerEmail:   { type: String },
  taxRate:         { type: Number, default: 0 },
  embroideryFiles: [{ location: String, dst: String }],
  inStorePickup:   { type: Boolean, default: false },
  // ── Storefront (Commerce Cloud) order fields ──────────────────────
  source:               { type: String },                 // e.g. "storefront"
  // Optional cart add-ons the buyer chose (gift bag, gift message, branded packaging…).
  giftAddOns: [{ id: String, label: String, priceCents: Number, message: String }],
  // Shipping method the buyer selected at checkout (e.g. "Standard", "Next Day", "International").
  shippingMethod: { type: String },
  // Communication consent captured at checkout (proof for TCPA/CAN-SPAM). orderUpdates = transactional
  // notifications (text + email); marketing = promotional email opt-in. `text` is the exact copy shown.
  consent: {
    orderUpdates: { type: Boolean, default: false },
    marketing:    { type: Boolean, default: false },
    phone:        { type: String },
    text:         { type: String },
    at:           { type: Date },
  },
  // Multi-vertical fulfillment: one storefront cart can mix a POD shirt, a dropshipped
  // electronic, and a warehoused supplement — each routed to its own fulfiller. The routing
  // engine splits the order by item.vertical and records one group per fulfiller here.
  fulfillmentGroups: [{
    vertical:  { type: String },   // pod | dropship | warehouse
    handler:   { type: String },   // provider | supplier | warehouse
    status:    { type: String },   // routed | pending_supplier | pending_warehouse | unroutable
    itemCount: { type: Number },
    ref:       { type: String },   // providerId / supplier email / warehouse ref
    reason:    { type: String },
  }],
  // Acquisition attribution — the channel/UTM of the session that placed this order (resolved at
  // placement from the analytics session). Powers REAL per-order channel ROI.
  attribution: { source: String, medium: String, campaign: String },
  paymentRef:           { type: String, sparse: true },   // Stripe PaymentIntent id — webhook idempotency key
  taxAmountCents:       { type: Number, default: 0 },      // Stripe Tax amount actually charged
  rewardsRedeemedCents: { type: Number, default: 0 },      // store credit applied at checkout
  giftCardRedeemedCents: { type: Number, default: 0 },     // gift-card balance applied at checkout
  giftCardCode:          { type: String },
  storefrontCustomerId: { type: mongoose.Schema.Types.ObjectId },
  // Inputs for the seller payout, captured at payment time (the Stripe fee can't be
  // recovered later). The transfer fires at fulfillment-ship settlement.
  // net = subtotalCents − wholesaleCents − (stripeFeeCents + 1% of subtotalCents)
  storefrontPayout: {
    subtotalCents:  { type: Number },
    wholesaleCents: { type: Number },
    stripeFeeCents: { type: Number },
    status:         { type: String, enum: ["pending", "paid", "skipped", "clawed_back"], default: "pending" },
    transferId:     { type: String },
    paidAt:         { type: Date },
  },
});
// Idempotency: at most one order per Stripe PaymentIntent.
schema.index({ orgId: 1, paymentRef: 1 }, { unique: true, sparse: true });

// schema.pre("save", async function (next) {
//   if (this.isNew) {
//     const existingModel = await this.constructor.findOne({ uniquePo: this.uniquePo, }).select('_id').lean();
//     if (existingModel) {
//       throw new Error("uniquePo must be unique");
//     }
//   }
//   next();
// });

schema.index({ date: -1 });
schema.index({ poNumber: 1 });
schema.index({ marketplace: 1 });
schema.index({ status: 1, date: -1 });
schema.index({ "shippingInfo.labels.trackingNumber": 1 }, { sparse: true });

export default PremierPrinting.model("Order", schema);
