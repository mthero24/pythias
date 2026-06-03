import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tier: {
        type: String,
        enum: ['starter', 'professional', 'business', 'scale', 'enterprise'],
        default: 'starter',
    },
    status: {
        type: String,
        enum: ['trial', 'active', 'suspended', 'cancelled'],
        default: 'trial',
    },
    billingEmail: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    // snapshot of current limits — set from TIERS on tier change
    limits: {
        ordersPerMonth: { type: Number, default: 500 },
        products: { type: Number, default: 250 },
        designs: { type: Number, default: 100 },
        integrations: { type: Number, default: 2 },
        users: { type: Number, default: 5 },
    },
    enabledIntegrations: [{ type: String }],
    // fast-check usage counters (authoritative source is UsageLedger)
    usage: {
        periodStart: { type: Date, default: Date.now },
        ordersThisMonth: { type: Number, default: 0 },
        productsTotal: { type: Number, default: 0 },
        designsTotal: { type: Number, default: 0 },
        usersTotal: { type: Number, default: 0 },
    },
    settings: {
        timezone: { type: String, default: 'America/New_York' },
        logoUrl: { type: String },
        primaryColor: { type: String },
        bulkThreshold: { type: Number, default: 5 },
        skuFormat: {
            parts: { type: [String], default: ["blank.code", "color.sku", "size.sku", "design.sku"] },
            separator: { type: String, default: "_" },
        },
        gs1: {
            apiKey: { type: String },
            secondaryKey: { type: String },
            accountNumber: { type: String },
        },
    },
    trialEndsAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ slug: 1 });
schema.index({ stripeCustomerId: 1 });

export default PlatformDB.model("Organization", schema);
