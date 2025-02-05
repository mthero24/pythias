import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Order from "./Order";
import Color from "./Color";
import Size from "./Size";
import Style from "./Style";
import StyleV2 from "./StyleV2";
const schema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: new Date(),
    },
    productCost: {
      type: Number,
      required: true,
    },
    storeCost: {
      type: Number,
    },
    pieceId: { type: String, required: true, unique: true },
    shippingType: { type: String, default: "Standard" },
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
    style: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Style",
    },
    styleV2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StyleV2",
    },
    size: {
      type: mongoose.Schema.Types.ObjectId,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    sizeName: String,
    styleCode: String,
    colorName: String,
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
    design: {
      front: {
        type: String,
      },
      back: {
        type: String,
      },
    },
    weight: Number,
    quantity: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
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
    lastScan: {
      station: String,
      date: Date,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { suppressWarning: true }
);

export default TSPprints.model("Item", schema);
