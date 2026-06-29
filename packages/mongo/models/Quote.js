import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// A pre-order estimate for the "Design & Send In → Quote" front-office flow.
// The customer self-designs in the studio (their art + placement IS the proof); the shop prices
// the production; on approve + pay the quote converts to a real Order. See the spec memory
// "quote-design-send-in-spec". No payment touches a card until the quote is sent + approved.

// One quoted line. Mirrors the studio/order item shape so converting to a real Item is 1:1.
const lineSchema = new mongoose.Schema({
    sku:       { type: String },
    title:     { type: String },
    blank:     { type: mongoose.Schema.Types.ObjectId },   // ref Blank (may be unresolved until priced)
    styleCode: { type: String },
    color:     { type: mongoose.Schema.Types.ObjectId },
    colorName: { type: String },
    size:      { type: mongoose.Schema.Types.ObjectId },
    sizeName:  { type: String },
    // Design / proof — same shape storefront + studio items carry (so renderImages can show it).
    design:          { type: Object },   // { location: imageUrl }
    personalization: { type: Object },   // { sides: [{ view, location, artworkUrl, place, styleImage }], fields: [...] }
    printType:       { type: String },
    image:           { type: String },   // preview thumbnail
    // Pricing — set by the shop when it reviews the request.
    quantity:  { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    setupFee:  { type: Number, default: 0 },
    notes:     { type: String },
});

const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, index: true },
    quoteId: { type: String, required: true, unique: true },   // QUOTE-...
    // requested → (shop prices) → sent → approved | declined | expired → converted
    status:  { type: String, default: "requested", index: true },

    customer: {
        name:    { type: String },
        email:   { type: String },
        phone:   { type: String },
        company: { type: String },
    },

    lines: [lineSchema],

    // Totals — shop-set. `total` is the pre-discount figure (matches the order-page convention:
    // amount due = total − discountAmount), so converting to an Order is a direct copy.
    discountAmount: { type: Number, default: 0 },
    discountName:   { type: String },
    shippingCost:   { type: Number, default: 0 },
    taxRate:        { type: Number, default: 0 },
    total:          { type: Number, default: 0 },

    // Public approve + pay page is gated by this unguessable token (mirrors order.invoiceToken);
    // payUrl / paymentSessionId come from the same Stripe Checkout direct-charge flow as invoices.
    token:            { type: String, index: true },
    paymentSessionId: { type: String },
    payUrl:           { type: String },

    message:       { type: String },   // note shown to the customer on the quote
    internalNotes: { type: String },

    shippingAddress: {
        name: String, phone: String, address1: String, address2: String,
        city: String, state: String, zip: String, country: { type: String, default: "US" },
    },
    inStorePickup: { type: Boolean, default: false },

    date:       { type: Date, default: Date.now },
    sentAt:     { type: Date },
    approvedAt: { type: Date },
    expiresAt:  { type: Date },

    orderId: { type: mongoose.Schema.Types.ObjectId },   // set when the quote converts to a production order
}, { timestamps: true });

schema.index({ orgId: 1, status: 1, date: -1 });

export default PremierPrinting.model("Quote", schema);
