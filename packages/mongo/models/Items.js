import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
import Blanks from "./Blanks";
import Design from "./Design"
import Inventory from "./inventory";
import ProductInventory from "./ProductInventory";
import { InventoryTwoTone } from "@mui/icons-material";
const schema = new mongoose.Schema(
  {
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    date: {
      type: Date,
      default: new Date(),
    },
    orderItemId: {type: String},
    pieceId: { type: String, required: true, unique: true },
    bulkId: {type: String },
    designSku: {type: String},
    upc: {type: String},
    poNumber: String,
    shippingType: { type: String, default: "Standard" },
    description: String,
    name: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
    },
    steps: [
      {
        status: String,
        date: Date,
      },
    ],
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    orderId: { type: String },
    blank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Blanks,
    },
   designRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Design,
    },
    size: {
      type: mongoose.Schema.Types.ObjectId,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    threadColor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    isBlank: { type: Boolean, default: false },
    isCommerceCloud: { type: Boolean, default: false },   // routed from Commerce Cloud — design travels as a map (no local Design doc)
    sizeName: String,
    styleCode: String,
    colorName: String,
    threadColorName: String,
    type: String,
    price: Number,
    paid: { type: Boolean, default: false },
    labelPrinted: { type: Boolean, default: false },
    labelPrintedDates: [{ type: Date }],
    labelLastPrinted: { type: Date },
    treated: { type: Boolean, default: false },
    treatedDate: Date,
    printed: { type: Boolean, default: false },
    printedDate: Date,
    frontPrinted: { type: Boolean, default: false },
    backPrinted: { type: Boolean, default: false },
    frontTreated: { type: Boolean, default: false },
    backTreated: { type: Boolean, default: false },
    folded: { type: Boolean, default: false },
    inBin: { type: Boolean, default: false },
    inBinDate: Date,
    bin: Number,
    shipped: { type: Boolean, default: false },
    shippedDate: Date,
    canceled: { type: Boolean, default: false },
    rePulled: { type: Boolean, default: false },
    rePulledTimes: { type: Number, default: 0 },
    rePulledReasons: [String],
    design: Object,
    weight: Number,
    quantity: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    label: { type: String },
    vendor: String,
    batchID: String,
    onPrinter: { type: Boolean, default: false },
    printerQue: {
      printer: String,
      scan: Number,
    },
    printedOn: String,
    printedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    refunded: { type: Boolean, default: false },
    buttonPrinted: { type: Boolean, default: false },
    dtfScan: { type: Boolean, default: false },
    options: String,
    lastScan: {
      station: String,
      date: Date,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    pulledFromReturn: {type: Boolean, default: false},
    returnBinNumber: Number,
    inventory: {
      inventoryType: "String",
      inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Inventory,
      },
      productInventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ProductInventory,
      },
    },
    stockStatus: { type: String, enum: ["inStock", "attached", "ordered", "noInv", null], default: null },
    updated: {type: Boolean, default: false},
    shipByDate: { type: Date },
    discount: { type: Number, default: 0 },
    discountName: { type: String },
    custom:  { type: Boolean, default: false },
    // Cart gift add-on items (gift bag, gift message, branded packaging) — their own line so the floor
    // handles them; no blank/design, so routing leaves them in-house.
    addOn:       { type: Boolean, default: false },
    addOnType:   { type: String },   // the add-on's id (e.g. "gift-bag", "gift-message")
    giftMessage: { type: String },   // the buyer's message for a gift-message add-on
    dstFile: { type: Object },  // { locationName: dstUrl } — one key per print location
    // Buyer personalization (custom-text designs from a DesignTemplate). The buyer's field values
    // are authoritative; production renders the final artwork server-side from template + values.
    personalization: {
        mode:       { type: String },   // "text" (template) | "upload" | "ai" | "studio"
        templateId: { type: mongoose.Schema.Types.ObjectId, ref: "DesignTemplate" },
        fields:     [{ id: String, label: String, value: String }],
        artworkUrl: { type: String },   // composed/placed custom artwork (create-your-own, single-side legacy)
        side:       { type: String },   // front | back …
        previewUrl: { type: String },   // buyer-facing preview thumbnail
        // Create-your-own multi-side placements: one entry per printed side (front/back/sleeve).
        // box is in the 400-reference frame the [...renderImages] compositor expects.
        sides: [{
            view:       { type: String },   // front | back | sleeve (UI grouping)
            location:   { type: String },   // the print location / envelope placement key, e.g. "front" / "back"
            artworkUrl: { type: String },   // CROPPED (tight, no blank space) high-res artwork for this side
            styleImage: { type: String },   // garment mockup the box belongs to
            // Normalized placement of the cropped artwork within the print area (envelope), 0–1.
            // rotation is baked into artworkUrl. Every print path derives its own units from this:
            //   DTF size   = wPct*envelope.width × hPct*envelope.height (inches)
            //   GTX offset = horizoffset + xPct*width , vertoffset + yPct*height (inches, from left/top)
            //   render     = boxX + xPct*boxW , boxY + yPct*boxH  (preview)
            place:      { xPct: Number, yPct: Number, wPct: Number, hPct: Number },
            box:        { type: mongoose.Schema.Types.Mixed },   // legacy { x, y, w, h } 400-space (kept for back-compat)
            // Cached server-rendered PLACEMENT PROOF (art composited on the garment at the exact
            // placement) — what production sees at "DTF Find" so they know how it should look.
            // The physical print stays size-only; this is a visual proof, generated lazily once.
            proofUrl:   { type: String },
        }],
    },
    // Multi-vertical routing: which fulfiller handles this line (default POD/print).
    vertical: { type: String, enum: ["pod", "dropship", "warehouse"], default: "pod" },
    dropshipSupplierEmail: { type: String },   // dropship: where the reorder/fulfillment notice goes
    warehouseSku: { type: String },            // warehouse (FBP): the stocked SKU to pick/pack
  },
  { suppressWarning: true }
);

schema.index({ sku: 1 });
schema.index({ order: 1 });

export default PremierPrinting.model("Item", schema);
