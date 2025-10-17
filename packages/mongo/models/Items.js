import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
import Blanks from "./Blanks";
import Design from "./Design"
import Inventory from "./inventory";
import ProductInventory from "./ProductInventory";
import { InventoryTwoTone } from "@mui/icons-material";
const schema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: new Date(),
    },
    orderItemId: {type: String},
    pieceId: { type: String, required: true, unique: true },
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
    sizeName: String,
    styleCode: String,
    colorName: String,
    threadColorName: String,
    type: String,
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
    }
  },
  { suppressWarning: true }
);

export default PremierPrinting.model("Item", schema);
