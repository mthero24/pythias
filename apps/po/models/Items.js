import mongoose from "mongoose";
mongoose.set('autoIndex', false);
import { TSPprints }  from "../lib/connection";
import Color from "./Color";
import { Inventory, ProductInventory } from "@pythias/mongo";

const PRINT_AREAS = [
  "front",
  "back",
  "leftPocket",
  "rightPocket",
  "middleChestLarge",
  "middleChestSmall",
  "nameplate",
  "leftSleeve",
  "rightSleeve",
  "left",
  "right",
];
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
      ref: Color,
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
    printedSides: Object,
    design: {
      type: Object,
      default: () => {
        const design = {};
        PRINT_AREAS.forEach((area) => {
          design[area] = String;
        });
        return design;
      },
    },
    printFiles: {
      type: Object,
      default: () => {
        const printFiles = {};
        PRINT_AREAS.forEach((area) => {
          printFiles[area] = String;
        });
        return printFiles;
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
    clockWise: {
      type: Boolean,
      default: false,
    },
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

export default TSPprints.model("Item", schema);
