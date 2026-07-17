const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
import Color from "./Color";
import printLocations from "./printLocations";
const Schema = mongoose.Schema;
let imageSchema = [{
  box: [ {
    type: mongoose.Schema.Types.Mixed,
  }],
  image: String,
  color: String,
  imageGroup: {type: Array, default: ["default"]},
  isModel: { type: Boolean, default: false },
}]
const SchemaObj = new Schema(
  {
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    type: { type: String, default: "single" },
    blanks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blank" }],
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
    aliasColors: [Object],
    sizes: [
      {
        name: { required: true, type: String },
        weight: { required: true, default: 0, type: Number },
        wholesaleCost: { default: 0, type: Number },
        wholesalePrice: { default: 0, type: Number },
        retailPrice: { default: 0, type: Number },
        compareAtPrice: { default: 0, type: Number },   // "regular"/MSRP price → storefront strikes it through when > retailPrice
        basePrice: { default: 0, type: Number },
        cost: { default: 0, type: Number },
        sku: String,
        blankSizes: Array,
        hidden: {type: Boolean, default: false}
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
        placement: { type: String },
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
    images: [{
      boxes: Object,
      sublimationBoxes: Object,
      image: String,
      color: String,
      imageGroup: { type: String, default: "default" },
      aiGenerated: { type: Boolean, default: false },
    }],
    multiImages: Object,
    //box.default['garment]
    //box[color_id]['garment]
    //always default to default then check if color override
    box: {
      type: mongoose.Schema.Types.Mixed,
    },
    sizeGuide: {
      image: String,
      images: [String],
      // Structured size chart shown on the storefront product page (filled in by the FC customer).
      enabled: { type: Boolean, default: false },
      unit: { type: String, default: "inches" },          // "All measurements in <unit>"
      columns: [String],                                   // measurement headers, e.g. ["Chest","Length","Neck Size"]
      rows: [{ size: String, values: [String] }],          // per-size measurements, values aligned to columns
      measureNotes: [{ title: String, body: String }],     // "How to Measure …" explanations
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
    extraLocationPriceCents: { type: Number, default: 0 },   // surcharge added per print spot beyond the first
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
    sanmarStyle:      { type: String, default: "" },
    ssActivewearStyle: { type: String, default: "" },
    manufacturerStyle: { type: String, default: "" },
    fixerCode: String,
    kohlsHeader: Object,
    targetHeader: Object,
    shopSimonHeader: Object,
    tikTokHeader: Object,
    shopifyHeader: Object,
    printLocations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: printLocations,
      },
    ],
    marketPlaceOverrides: {},
    singleShippingDimensions: Object,
    hiddenColors: [String],
  },
  { strict: false }
);
export default PremierPrinting.model("Blank", SchemaObj);
