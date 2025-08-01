import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Design from "./Design";
import Blank from "./Blanks";
import Color from "./Color";
import MarketPlaces from "./MarketPlaces";
import { CategoryRounded, Upcoming } from "@mui/icons-material";
const schema = new mongoose.Schema({
    design: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Design,
    },
    blanks: [ {
        type: mongoose.Schema.Types.ObjectId,
        ref: Blank,
    }],
    colors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    }],
    threadColors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    }],
    productImages: [{
        blank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Blank,
        },
        color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        threadColor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        image: String,
        sku: String,
        side: String
    }],
    variants: Object,
    variantsArray: [{
        image: String,
        images: [String],
        color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        size: String,
        sku: String,
        threadColor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        upc: String,
        blank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Blank,
        },
        gtin: String,
    }],
    variantImages: Object,
    variantSecondaryImages: Object,
    defaultColor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    },
    hasThreadColor: { type: Boolean, default: false },
    sizes: [Object],
    description: String,
    brand: String,
    sku: { type: String},
    title: String,
    marketPlaces: Object,
    marketPlacesArray: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: MarketPlaces
        }
    ],
    gender: String,
    season: String,
    tags: [String],
    theme: String,
    sportUsedFor: String,
    department: [String],
    category: [String],
    lastUpdated: {type: Date, default: Date.now}, 
});
export default PremierPrinting.model("Products", schema);