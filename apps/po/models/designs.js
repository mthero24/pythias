
import { cluster1 } from "@/lib/connection";
const mongoose = require("mongoose");

const PRINT_AREA_ENUM = [
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

const schema = new mongoose.Schema({
  name: { type: String },
  discription: { type: String, es_boost: 2.0 },
  sku: { type: String, unique: true },
  default_color: String,
  light_image: String,
  sublimation_light_image: String,
  sublimation_dark_image: String,
  dark_image: String,
  dark_image_back: String,
  light_image_back: String,
  backups: {
    light_image: String,
    dark_image: String,
    dark_image_back: String,
    light_image_back: String,
  },
  custom_light_image: String,
  custom_dark_image: String,
  custom_canvas_light: [{ type: String }],
  frontPrintArea: {
    type: String,
    enum: PRINT_AREA_ENUM,
    default: "front",
  },
  backPrintArea: {
    type: String,
    enum: PRINT_AREA_ENUM,
    default: "back",
  },
  printFiles: [
    {
      url: String,
      width: Number,
      height: Number,
      fileType: String,
    },
  ],
  printType: String,
  canvas_width: Number,
  custom_font: String,
  product_image: String,
  product_image_back: String,
  product_image_front_back: String,
  available_on: { type: Date },
  catalog: String,
  vendor: String,
  published: { type: String, default: "false" },
  isCustom: { type: Boolean, default: false },
  slug: String,
  tags: { type: Array },
  mainCategory: String,
  subCategory: String,
  longTermCategory: String,
  styles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Style",
    },
  ],
  //new system
  productImages: {}, //style code as reference
  productSlugs: [], //array of slug strings
  styleref: {}, // slug as reference, style & department as object contents
  //
  //
  stylecodes: [], //list of style code of the styles the design has to help in search
  departments: [], // list of departments to help in search
  productSizes: {},
  productColors: {},
  design_id: Number,
  excluded_colors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
  ],
  removeFromGoogleFeed: { type: Boolean, default: false },
  tempRemoveFromGoogleFeed: { type: Boolean, default: false },
  missingImage: Boolean,
  originalLightImage: String,
  originalDarkImage: String,
  addedToCart: { type: Number, es_type: "number", es_indexed: true },
  impactImages: [
    {
      styleCode: String,
      Color: String,
      colorName: String,
      images: {
        garment_image: String,
        front_image: String,
        back_image: String,
        swatch_image: String,
      },
    },
  ],
  salesPerStyle: { type: Object, es_type: "object", es_indexed: true },
  storeOwner: { type: mongoose.Schema.Types.ObjectId, ref: "StoreOwner" },
  oldStoreOwner: { type: mongoose.Schema.Types.ObjectId, ref: "StoreOwner" },
  wasStoreDesign: { type: Boolean, default: false },
  wasAutoPublished: { type: Boolean, default: false },
  tspStore: { type: String, es_indexed: true },
  publishedMarketplaces: [{ type: "String" }],
  approved: Boolean,
  flagged: { type: Boolean, default: false },
  flaggedReason: { type: String },
  flaggedDate: Date,
  aiChecked: { type: Boolean, default: false },
  aiCheckedDate: Date,
  aiCheckedJSON: { type: String },
  aiFlagged: { type: Boolean, default: false },
  adultContent: { type: Boolean, default: false },
  sales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  isStoreDesign: { type: Boolean, default: false, es_indexed: true },
  LastSentToFeed: Date,
  needsToBeRegenerated: { type: Boolean, default: false },
  customText: {
    isCustom: { type: Boolean, default: false },
    canvas_front_light: String,
    canvas_back_light: String,
    canvas_front_dark: String,
    canvas_back_dark: String,

    design_front_light: String,
    design_front_dark: String,
    design_back_light: String,
    design_back_dark: String,

    widthLimited: [String],

    fonts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Font" }],
  },
  checked: { type: Boolean, Default: false },
  sale: {
    percentOff: Number,
    start: Date,
    End: Date,
  },
  amazonPublishDate: Date,
  purchases: { type: Number, default: 0 },
  lastPurchased: Date,
  isPublishedToAmazon: { type: Boolean, default: false },
  isPublishedToEtsy: { type: Boolean, default: false },
  products1: [],
  newSales: {
    minute: { type: Number, default: 0 },
    hour: { type: Number, default: 0 },
    day: { type: Number, default: 0 },
    week: { type: Number, default: 0 },
    month: { type: Number, default: 0 },
    month3: { type: Number, default: 0 },
    Year: { type: Number, default: 0 },
  },
  recentSales: [
    {
      type: Date,
    },
  ],
  isExpired: { type: Boolean, default: false },
  deletesOn: { type: Date },
  confirmExpired: { type: Boolean, default: false },
  unpublishedBy: { type: String },
  processed: { type: Boolean, default: false },
  isLandingPageProduct: { type: Boolean, default: false },
  inStorePickup: { type: Boolean, default: false },
  imagesReprocessed: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  fixed: { type: Boolean, default: false },
  sublimation: { type: Boolean, default: false },
  hasSublimation: { type: Boolean, default: false },
  needsRepublish: { type: Boolean, default: false },
  duplicateStyleFix: { type: Boolean, default: false },
  deletedFromGoogleFeed: { type: Boolean, default: false },
  failedToTrevco: { type: Boolean, default: false },
  customlabel1: { type: Boolean, default: false },
  customLabel2: { type: String },
  likes: { type: Number, default: 0 },
  isSingleSku: { type: Boolean, default: false },
  colors: [],
  group: String,
  sizes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
    },
  ],
  inventory: {},
  addedAllDesignVersion: Number,
  onFaceBook: { type: Boolean, default: false },
  hasCanvas: { type: Boolean, default: false },
  wasabiGoogleLinks: { type: mongoose.Schema.Types.Mixed },
  onBackBlaze: { type: Boolean, default: false },
  sendWasabiLinks: { type: Boolean, default: false },
  removeFromGoogleTag: { type: String },
  excluded_departments: [{ type: String }],
  color_type: { type: String },
  updatedWithColorType: { type: Boolean, default: false },
  hideWhites: { type: Boolean, default: false },
  hideBlacks: { type: Boolean, default: false },
  newProduct: { type: Boolean, default: false },
  noSales: { type: Boolean, default: false },
  checkedWasabi: { type: Boolean, default: false },
  addedToImages: { type: Boolean, default: false },
  searchProductsMade: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  transcription: { type: String },
  imageWidth: { type: Number },
  lastUpdated: { type: Date },
  qrCodeUrl: { type: String },
  additionalPrompt: { type: String },
  newestRank: { type: Number },
  bestSellingRank: { type: Number },
  aiCustomizable: { type: Boolean, default: false },
  aiCustomizableConfig: {
    prompt: { type: String },
    inputs: [
      {
        inputType: { type: String, enum: ["text", "number", "color", "image"] },
        name: String,
        description: String,
        placeholder: String,
        rows: { type: Number, default: 1 },
      },
    ],
  },
  updatedLinks: {type: Boolean, default: false}
});

const Design = cluster1.models.Design || cluster1.model("Design", schema); // Use cluster2 for the Design model
const UnpublishedDesign =
  cluster1.models.UnpublishedDesign ||
  cluster1.model("UnpublishedDesign", schema); // Use cluster2 for the Design model

export { Design, UnpublishedDesign };
