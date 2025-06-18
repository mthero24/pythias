import mongoose from "mongoose";
import { PremierPrinting }from "../lib/connection";
import Color from "./Color"
import Brands from "./Brands"
const schema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  isLicenseDesign: {type: Boolean, default: false},
  licenseHolder: { type: mongoose.Schema.Types.ObjectId,
    ref: "LicenseHolders"},
  printType: { type: String,
    enum : ['EMB','VIN', 'SCN', 'DTF'],
    default: 'DTF'},
  images: {
    front: { type: String },
    back: { type: String },
    upperSleeve: { type: String },
    lowerSleeve: { type: String },
    pocket: {type: String},
    center: {type: String}
  },
  embroideryFiles: {
    front: { type: String },
    back: { type: String },
    upperSleeve: { type: String },
    lowerSleeve: { type: String },
    pocket: {type: String},
    center: {type: String}
  },
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
  onShopify: {type: Boolean, default: false}
});

export default PremierPrinting.model("Design", schema);
