import mongoose from "mongoose";
import { TSPprints } from "../lib/connection";

const schema = new mongoose.Schema({
    payload:    { type: mongoose.Schema.Types.Mixed },
    computedAt: { type: Date, default: Date.now },
});

export default TSPprints.model("ForecastCache", schema, "forecastcache");
