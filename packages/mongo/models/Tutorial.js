import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        videoType:    { type: String, default: "tutorial", enum: ["tutorial", "testimonial", "demo", "page-video"] },

        // Shared fields
        title:        { type: String, default: "" },
        description:  { type: String, default: "" },
        videoUrl:     { type: String, required: true },
        thumbnailUrl: { type: String, default: "" },
        published:    { type: Boolean, default: true },
        order:        { type: Number, default: 0 },

        // Tutorial fields
        category:     { type: String, default: "" },
        product:      { type: String, default: "fulfillment-cloud", enum: ["fulfillment-cloud", "commerce-cloud", "both"] },

        // Testimonial fields
        customerName: { type: String, default: "" },
        company:      { type: String, default: "" },
        role:         { type: String, default: "" },
        rating:       { type: Number, default: 5, min: 1, max: 5 },

        // Demo video fields
        demoType:     { type: String, default: "" }, // product-overview | feature-walkthrough | onboarding | integration

        // Page video fields
        targetPage:   { type: String, default: "" }, // which page this video appears on
        placement:    { type: String, default: "" }, // hero | section | sidebar
    },
    { timestamps: true }
);

schema.index({ videoType: 1, published: 1 });
schema.index({ category: 1, order: 1 });
schema.index({ targetPage: 1 });

export default Pythias.model("Tutorial", schema, "tutorials");
