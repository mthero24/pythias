import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        title:          { type: String, required: true },
        slug:           { type: String, required: true, unique: true },
        content:        { type: String, required: true },
        excerpt:        { type: String, default: "" },
        author:         { type: String, default: "Pythias Technologies" },
        tags:           [{ type: String }],
        coverImage:     { type: String, default: "" },
        published:      { type: Boolean, default: true },
        publishedAt:    { type: Date },
        // SEO / structured data
        metaDescription:{ type: String, default: "" },
        jsonLd:         { type: mongoose.Schema.Types.Mixed, default: null },
        faqJsonLd:      { type: mongoose.Schema.Types.Mixed, default: null },
        languageCode:   { type: String, default: "en" },
        // External source tracking
        externalId:     { type: Number, default: null },
        externalUrl:    { type: String, default: "" },
    },
    { timestamps: true }
);

schema.index({ published: 1, publishedAt: -1 });
schema.index({ tags: 1 });
schema.index({ externalId: 1 });

export default Pythias.model("Article", schema, "articles");
