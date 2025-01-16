const mongoose = require('mongoose');
const {cluster1} = require('../lib/connection');
const Schema = mongoose.Schema;
const SchemaObj = new Schema({
    style_id: Number,
    name: String,
    code: String,
    brand: String,
    description: String,
    "google-description": String,
    meta_description: String,
    meta_tags: { type: [String] },
    tags: [String],
    department: String,
    category: String,
    canonical_style: String,
    care_instructions: String,
    dimensions: String,
    fabric: String,
    fit: String,
    garment: String,
    handling_time: String,
    hood: String,
    label: String,
    material: String,
    neck: String,
    pocket: String,
    sleeves: String,
    size_chart: String,
    image: String,
    imageOverlays: [{
        'url': String,
        'overlay_type': String,
        'side': String,
        'generated': Boolean
    }],
    vendor: String,
    vendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],
    oldVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],
    catalogs: [],
    colors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }],
    colorSizes: {
        color: String,
        sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Size' }]
    },
    sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Size' }],
    envleopes: [{
        size: String,
        platen: { type: Number, default: 2 },
        width: { type: Number, default: 11 },
        height: { type: Number, default: 15 },
        vertoffset: { type: Number, default: 0.4 },
        horizoffset: { type: Number, default: 0 }
    }],
    profiles: [{
        type: { type: String, default: "dark" },
        highlight: { type: Number, default: 5 },
        mask: { type: Number, default: 3 },
    }],
    pretreatments: [{
        type: { type: String, default: "dark" },
        fluid: { type: Number, default: 2 },
        density: { type: Number, default: 25 },
        passes: { type: Number, default: 1 }
    }],
    firefly: [{
        type: { type: String, default: "dark" },
        cureTemp: { type: Number, default: 298 },
        cureTime: { type: Number, default: 60 },
        exhaust: { type: Number, default: 100 },
        cooler: { type: Number, default: 100 },
        convectionTop: { type: Number, default: 0 },
        convectionBottom: { type: Number, default: 0 },
        ControlMode: { type: String, default: "CAM" },
        pressTime: {type: Number, default: 5},
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
        }
    }],
    prices: [{
        size: String,
        price: Number,
        blankPrice: Number,
        printOnDemandPrice: Number,
        weight: Number
    }],
    slug: String,
    psdTemplates: [{
        link: String,
        side: String
    }],
    sublimationTemplates: [{
        link: String,
        size: String
    }],
    psdLastUpdated: Date,
    images: [{
        color: String,
        frontBackSwatch: String,
        image: String
    }],
    box: {
        garment: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number,
            wrap: {
                a: Number,
                b: Number,
                xOffset: Number,
                yOffset: Number,
                canvas_width: Number,
                canvas_height: Number
            }
        },
        front: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number,
            wrap: {
                a: Number,
                b: Number,
                xOffset: Number,
                yOffset: Number,
                canvas_width: Number,
                canvas_height: Number
            }
        },
        back: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number,
            wrap: {
                a: Number,
                b: Number,
                xOffset: Number,
                yOffset: Number,
                canvas_width: Number,
                canvas_height: Number
            }
        },
        side: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number,
            wrap: {
                a: Number,
                b: Number,
                xOffset: Number,
                yOffset: Number
            }
        },
        swatch: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number
        },
        garmentBack: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number
        },
        podGarment: {
            height: Number,
            width: Number,
            margin: Number,
            designWidth: Number,
            designHeight: Number,
            left: Number
        }
    },
    size_guide: String,
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
    product_skus: [{ sku: String, weight: Number, vendor: String, colorSwaps: [{ target: String, destination: String, isGlobal: { type: Boolean, default: false } }] }],
    isShopify: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: true },
    shopifySalesPercentage: { type: Number },
    brandsUsed: [{ type: String }],
    sales: Number,
    created: Date,
    outOfStock: [{
        size_name: String,
        color_name: String
    }],
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
    printOnBack: {type: Boolean, default: true},
    creatorCentered: {type: Boolean, default: false},
    hasExtra: {type:Boolean, default: false},
    extras: [String],
    averageWeights: {},
    fitLinks: [{code: String, title: String}],
    fold: [
        {
            size: String,
            fold: String,
            sleeves: Number,
            body: Number
        }
    ],
    additionalStyles: [
        {type: String}
    ],
    addOns: [
        {type: String}
    ],
    isHeavyShipping: {type: Boolean, default: false},
    blanksOnly:{type: Boolean, default: false},
    brandName: {type: String},
    blank_images:[{link:String, side: String}],
    quantityDiscounts: [{
        quantity: Number,
        percentage: Number
    }],
    productID: String,
    avDate: Date,
    facebookStyle: {type: Boolean, default: false},
    removeFromGoogle:{type: Boolean, default: false},
    isPrintOracleStyle: {type: Boolean, default: false},
    sizeGuideImage: {type:String},
}, { strict: false });
export default cluster1.model('Style', SchemaObj, 'styles');
