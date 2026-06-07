import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
    // Only manual steps are stored — auto-detected steps are computed at query time
    manualSteps: {
        shippingHardware: { type: Boolean, default: false },
        internalServer:   { type: Boolean, default: false },
        fileWriter:       { type: Boolean, default: false },
    },
    dismissed: { type: Boolean, default: false },
}, { timestamps: true });

export default PlatformDB.model("SetupGuide", schema, "setup_guides");
