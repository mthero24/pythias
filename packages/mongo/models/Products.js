import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Design from "./Design";
import Blank from "./Blanks";
import Color from "./Color";
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
    gender: String,
    season: String,
    tags: [String],
});
export default PremierPrinting.model("Products", schema);