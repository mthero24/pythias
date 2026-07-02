import mongoose from "mongoose";
import { PremierPrinting }from "../lib/connection";
import Color from "./Color"
import Brands from "./Brands"
const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  isLicenseDesign: {type: Boolean, default: false},
  licenseHolder: { type: mongoose.Schema.Types.ObjectId,
    ref: "LicenseHolders"},
  printType: { type: String, default: 'DTF'},
  images: Object,
  sublimationImages: Object,
  embroideryFiles: Object,
  threadColors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: Color,
  }],
  threadImages: {},
  blanks: [{
    blank:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blank",
    },
    colors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
    }],
    defaultColor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
    },
    defaultImages: [{
      id: String,
      color: String,
      side: String
    }],
    nrf_size: String
  }],
  b2m: [{
    brand: String,
    marketPlaces: [String]
  }],
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: Brands,
  }],
  marketPlaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Marketplaces",
  }],
  imageGroup: {type: String, default: "default"},
  imagesAdded: {type: Boolean, default: false},
  published: {type: Boolean, default: false},
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  overrideImages: Object,
  cleaned: {type: Boolean, default: false},
  gender: String,
  season: String,
  sendToMarketplaces: {type: Boolean, default: false},
  // Internal cost inputs (COGS/margin tracking, not customer-facing):
  // printAreaSqIn drives DTF/DTG ink cost (area × org $/in² rate); numColors drives
  // screen-burn cost (colors × org $/screen rate) for screen-printed jobs.
  printAreaSqIn: { type: Number },
  numColors: { type: Number },
});

export default PremierPrinting.model("Design", schema);
