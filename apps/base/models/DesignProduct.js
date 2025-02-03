import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";

const schema = new mongoose.Schema({
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
  },
  style: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Style",
  },
  colors: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Color",
    }
  ]
});

export default TSPprints.model("DesignProduct", schema);
