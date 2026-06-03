import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:                  { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:                   { type: String, required: true },
    sizeConverter:          Object,
    colorFamilyConverter:   Object,
    headers:                [Object],
    brand:                  String,
    credentials:            Object,
    defaultValues:          Object,
    productDefaultValues:   Object,
    productDropDowns:       Object,
    required:               Object,
    hasProductLine:         [{ type: Boolean, default: false }],
    disableProductDefaults: [{ type: Boolean, default: false }],
    connections:            [String],
    variantTitle:           { type: Boolean, default: false },
});

schema.index({ orgId: 1, name: 1 });

export default PlatformDB.model("PlatformMarketPlace", schema);
