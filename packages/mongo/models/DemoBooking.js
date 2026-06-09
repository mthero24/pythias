import mongoose from "mongoose";
import { Pythias } from "../lib/connection";

const schema = new mongoose.Schema(
    {
        name:          { type: String, required: true },
        email:         { type: String, required: true },
        company:       { type: String, default: "" },
        phone:         { type: String, default: "" },
        date:          { type: String, required: true },   // "YYYY-MM-DD"
        startTime:     { type: String, required: true },   // "09:00"
        endTime:       { type: String, required: true },   // "10:00" (always +1 hour)
        meetLink:      { type: String, default: "" },
        googleEventId: { type: String, default: "" },
        notes:         { type: String, default: "" },
        status:        { type: String, default: "confirmed", enum: ["confirmed", "cancelled", "no-show"] },
    },
    { timestamps: true }
);

schema.index({ date: 1 });
schema.index({ email: 1 });
schema.index({ date: 1, startTime: 1 }, { unique: true });

export default Pythias.model("DemoBooking", schema, "demo_bookings");
