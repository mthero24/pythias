import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        title:        { type: String, required: true },
        description:  { type: String, default: "" },
        category:     { type: String, required: true },
        videoUrl:     { type: String, required: true },
        thumbnailUrl: { type: String, default: "" },
        published:    { type: Boolean, default: true },
        order:        { type: Number, default: 0 },
    },
    { timestamps: true }
);

schema.index({ category: 1, order: 1 });
schema.index({ published: 1 });

export default Pythias.model("Tutorial", schema, "tutorials");
