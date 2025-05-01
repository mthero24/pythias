import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
import Blanks from "./Blanks";
import Design from "./Design"
const schema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: new Date(),
    },
    orderItemId: {type: String},
    pieceId: { type: String, required: true, unique: true },
    upc: {type: String},
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
    rePulledReasons: [String],
    design: {
      front: { type: String },
      back: { type: String },
      upperSleeve: { type: String },
      lowerSleeve: { type: String },
      pocket: {type: String},
      center: {type: String}
    },
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
    lastScan: {
      station: String,
      date: Date,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { suppressWarning: true }
);

export default PremierPrinting.model("Item", schema);
