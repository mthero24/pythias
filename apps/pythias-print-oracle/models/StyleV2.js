import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import Color from "./Color";
const Schema = mongoose.Schema;
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
    envleopes: [
      {
        size: String,
        sizeName: String,
        platen: { type: Number, default: 2 },
        width: { type: Number, default: 11 },
        height: { type: Number, default: 15 },
        vertoffset: { type: Number, default: 0.4 },
        horizoffset: { type: Number, default: 0 },
      },
    ],
    profiles: [
      {
        type: { type: String, default: "dark" },
        highlight: { type: Number, default: 5 },
        mask: { type: Number, default: 3 },
      },
    ],
    pretreatments: [
      {
        type: { type: String, default: "dark" },
        fluid: { type: Number, default: 2 },
        density: { type: Number, default: 25 },
        passes: { type: Number, default: 1 },
      },
    ],
    firefly: [
      {
        type: { type: String, default: "dark" },
        cureTemp: { type: Number, default: 298 },
        cureTime: { type: Number, default: 60 },
        exhaust: { type: Number, default: 100 },
        cooler: { type: Number, default: 100 },
        convectionTop: { type: Number, default: 0 },
        convectionBottom: { type: Number, default: 0 },
        ControlMode: { type: String, default: "CAM" },
        pressTime: { type: Number, default: 5 },
        bulbs: {
          bulb1: { type: Number, default: 100 },
          bulb2: { type: Number, default: 100 },
          bulb3: { type: Number, default: 100 },
          bulb4: { type: Number, default: 100 },
          bulb5: { type: Number, default: 100 },
          bulb6: { type: Number, default: 100 },
          bulb7: { type: Number, default: 100 },
          bulb8: { type: Number, default: 100 },
          bulb9: { type: Number, default: 100 },
          bulb10: { type: Number, default: 100 },
          bulb11: { type: Number, default: 100 },
          bulb12: { type: Number, default: 100 },
          bulb13: { type: Number, default: 100 },
          bulb14: { type: Number, default: 100 },
          bulb15: { type: Number, default: 100 },
          bulb16: { type: Number, default: 100 },
          bulb17: { type: Number, default: 100 },
          bulb18: { type: Number, default: 100 },
          bulb19: { type: Number, default: 100 },
          bulb20: { type: Number, default: 100 },
          bulb21: { type: Number, default: 100 },
          bulb22: { type: Number, default: 100 },
          bulb23: { type: Number, default: 100 },
          bulb24: { type: Number, default: 100 },
          bulb25: { type: Number, default: 100 },
          bulb26: { type: Number, default: 100 },
          bulb27: { type: Number, default: 100 },
          bulb28: { type: Number, default: 100 },
          bulb29: { type: Number, default: 100 },
          bulb30: { type: Number, default: 100 },
          bulb31: { type: Number, default: 100 },
          bulb32: { type: Number, default: 100 },
          bulb33: { type: Number, default: 100 },
          bulb34: { type: Number, default: 100 },
          bulb35: { type: Number, default: 100 },
          bulb36: { type: Number, default: 100 },
          bulb37: { type: Number, default: 100 },
          bulb38: { type: Number, default: 100 },
          bulb39: { type: Number, default: 100 },
          bulb40: { type: Number, default: 100 },
          bulb41: { type: Number, default: 100 },
          bulb42: { type: Number, default: 100 },
          bulb43: { type: Number, default: 100 },
          bulb44: { type: Number, default: 100 },
          bulb45: { type: Number, default: 100 },
          bulb46: { type: Number, default: 100 },
          bulb47: { type: Number, default: 100 },
          bulb48: { type: Number, default: 100 },
          bulb49: { type: Number, default: 100 },
          bulb50: { type: Number, default: 100 },
          bulb51: { type: Number, default: 100 },
          bulb52: { type: Number, default: 100 },
          bulb53: { type: Number, default: 100 },
          bulb54: { type: Number, default: 100 },
        },
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
    images: [
      {
        color: String,
        image: String,
        frontBackSwatch: String,
      },
    ],
    //box.default['garment]
    //box[color_id]['garment]
    //always default to default then check if color override
    box: {
      type: mongoose.Schema.Types.Mixed,
    },
    sizeGuide: {
      csv: String,
      image: String,
    },
    rating: {
      star5: { type: Number, default: 0 },
      star4: { type: Number, default: 0 },
      star3: { type: Number, default: 0 },
      star2: { type: Number, default: 0 },
      star1: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
    },
    review_fit: {
      trueToSize: { type: Number, default: 0 },
      runsLarge: { type: Number, default: 0 },
      runsSmall: { type: Number, default: 0 },
    },
    published: { type: Boolean, default: true },
    isOnCustomCreator: { type: Boolean, default: true },
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
    quantityDiscounts: [
      {
        quantity: Number,
        discount: Number,
      },
    ],
    removeFromGoogle: { type: Boolean, default: false },
    tearawayLabel: { type: Boolean, default: false },
    onlyAvailableForBulk: { type: Boolean, default: false },
    heavyShipping: { type: Boolean, default: false },
    defaultStyle: { type: Boolean, default: false },
    printTypes: [{ type: String }],
    sizeChart: { type: String },
    searchTagKeywords: [{type: String}],
    searchTagModifiers: [{type: String}],
    tags: [{type: String}],
  },
  { strict: false }
);
export default TSPprints.model("StyleV2", SchemaObj);
