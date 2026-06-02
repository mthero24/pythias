import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    role: {
        type: String,
        enum: ['owner', 'admin', 'operator', 'viewer'],
        default: 'operator',
    },
    permissions: { type: Object, default: {} },
    avatar: { type: String },
    lastSeen: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ orgId: 1 });
schema.index({ email: 1 }, { unique: true });
schema.index({ userName: 1, orgId: 1 }, { unique: true });

schema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
});

export default PlatformDB.model("PlatformUser", schema);
