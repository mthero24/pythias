const mongoose = require("mongoose");
const { PremierPrinting } = require("../lib/connection");
import { ImageSharp } from "@mui/icons-material";
import Color from "./Color";
const Schema = mongoose.Schema;
let imageSchema = [{
  box: [ {
    type: mongoose.Schema.Types.Mixed,
  }],
  image: String,
  color: String,
  imageGroup: {type: Array, default: ["default"]}
}]
const SchemaObj = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    brand: String,
    active: { type: Boolean, default: true },
    suppliers: [{ type: String }],
    description: String,
    department: String,
    retailPrice: Number,
    category: [String],
    subcategory: String,
    handlingTime: {
      min: Number,
      max: Number,
    },
    imageOverlays: [
      {
        url: String,
        overlay_type: String,
        side: String,
        generated: Boolean,
      },
    ],
    vendor: String,
    colors: [{ type: mongoose.Schema.Types.ObjectId, ref: Color }],
    sizes: [
      {
        name: { required: true, type: String },
        weight: { required: true, default: 0, type: Number },
        wholesaleCost: { default: 0, type: Number },
        retailPrice: { default: 0, type: Number },
        basePrice: { default: 0, type: Number },
      },
    ],
    bulletPoints: [
      {
        title: String,
        description: String,
      },
    ],

    //this stuff needs to all get refactored into a separate model (like a production model that holds all this data & is based off style_id or styleCode)
    envelopes: [
      {
        size: String,
        sizeName: String,
        platen: { type: Number, default: 2 },
        width: { type: Number, default: 11 },
        height: { type: Number, default: 15 },
        vertoffset: { type: Number, default: 0.4 },
        horizoffset: { type: Number, default: 0 },
        placement: {type: String, enum: ["front", "back", "sleeve", "pocket", "hood", "leg", "side"], default: "front" }
      },
    ],
    
    fold: [
      {
        size: String,
        sizeName: String,
        fold: String,
        sleeves: Number,
        body: Number,
      },
    ],
    // END
    slug: String,
    /*
    images[color_id].front
    images[color_id].back
    images[color_id].swatch
    images[color_id].garment
    images[color_id].model
    images[color_id].extra
    images[color_id].sleeve
    */
    multiImages: {
      front: imageSchema,
      back: imageSchema,
      sleeve:imageSchema,
      pocket: imageSchema,
      hood: imageSchema,
      leg:imageSchema,
      side: imageSchema,
      upperSleeve: imageSchema,
      lowerSleeve: imageSchema,
      center: imageSchema,
      modelFront:imageSchema,
      modelBack: imageSchema,
    },
    //box.default['garment]
    //box[color_id]['garment]
    //always default to default then check if color override
    box: {
      type: mongoose.Schema.Types.Mixed,
    },
    sizeGuide: {
      csv: String,
      image: [String],
    },
    videos: [String],
    sales: { type: Number, default: 0 },
    outOfStock: [
      {
        size_name: String,
        color_name: String,
      },
    ],
    printOnBack: { type: Boolean, default: true },
    hasExtra: { type: Boolean, default: false },
    extras: [String],
    averageWeights: {},
    isHeavyShipping: { type: Boolean, default: false },
    tearawayLabel: { type: Boolean, default: false },
    onlyAvailableForBulk: { type: Boolean, default: false },
    heavyShipping: { type: Boolean, default: false },
    defaultStyle: { type: Boolean, default: false },
    printTypes: [{ type: String }],
    sizeChart: { type: String },
    searchTagKeywords: [{ type: String }],
    searchTagModifiers: [{ type: String }],
    tags: [{ type: String }],
  },
  { strict: false }
);
export default PremierPrinting.model("Blank", SchemaObj);
