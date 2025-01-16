import mongoose from "mongoose";
const { TSPprints } = require("../lib/connection");
import StyleV2 from "./StyleV2";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  logo: {
    type: String,
    required: true,
    trim: true,
  },
  banner: {
    type: String,
    trim: true,
  },
  primaryColor: {
    type: String,
    required: true,
    trim: true,
    default: "#76D7C4",
  },
  secondaryColor: {
    type: String,
    required: true,
    trim: true,
    default: "#39E56E",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    trim: true,
  },
  slogan: {
    type: String,
  },
  settings: {
    shipping: {
      Standard: {
        base: { type: Number, default: 6.99 },
        additional: { type: Number, default: 1 },
        active: { type: Boolean, default: true },
      },
      Expedited: {
        base: { type: Number, default: 14.99 },
        additional: { type: Number, default: 2 },
        active: { type: Boolean, default: true },
      },
      SecondDay: {
        base: { type: Number, default: 24.99 },
        additional: { type: Number, default: 3 },
        active: { type: Boolean, default: true },
      },
      NextDay: {
        base: { type: Number, default: 49.99 },
        additional: { type: Number, default: 3 },
        active: { type: Boolean, default: true },
      },
    },
    tax: [
      {
        state: String,
        charge: Number,
      },
    ],
  },
  prices: {},
  productPricing: { type: mongoose.Schema.Types.Mixed },
  inactiveStyles: [{ type: mongoose.Schema.Types.ObjectId, ref: StyleV2 }],
  hostname: String,
  backToStoreLink: String,
  salesMan: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  commission: { type: Number, default: 0 },
  activeStyles: [{ type: mongoose.Schema.Types.ObjectId, ref: StyleV2 }],
  storePassword: { type: String },
});

export default TSPprints.model("Store", schema);
