import mongoose from "mongoose";
import { PremierPrinting } from "@/lib/connection";

// ── PageView ──────────────────────────────────────────────────────────────────
// One document per page visit. Updated with timing/vitals on leave.
const PageViewSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, index: true },
    userId:     { type: String, default: null },
    page:       { type: String, required: true },
    referrer:   { type: String, default: "" },
    enteredAt:  { type: Date, default: Date.now },
    timeOnPage: { type: Number, default: null },  // seconds, set on leave
    interacted: { type: Boolean, default: null },  // mouse/scroll/key detected
    isBot:      { type: Boolean, default: false },
    botReason:  { type: String, default: null },
    userAgent:  { type: String, default: "" },
    ip:         { type: String, default: "" },
    vitals: {
        lcp:      Number,  // Largest Contentful Paint (ms)
        cls:      Number,  // Cumulative Layout Shift score
        ttfb:     Number,  // Time to First Byte (ms)
        fcp:      Number,  // First Contentful Paint (ms)
        inp:      Number,  // Interaction to Next Paint (ms)
        loadTime: Number,  // Total page load time (ms)
    },
});
PageViewSchema.index({ enteredAt: -1 });
PageViewSchema.index({ page: 1, enteredAt: -1 });
PageViewSchema.index({ isBot: 1, enteredAt: -1 });

// ── Session ───────────────────────────────────────────────────────────────────
// One document per browser session. Built up as pageviews arrive.
const SessionSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, unique: true },
    userId:     { type: String, default: null },
    startedAt:  { type: Date, default: Date.now },
    lastSeen:   { type: Date, default: Date.now },
    pages:      [String],           // ordered list of pages visited
    totalTime:  { type: Number, default: 0 },  // seconds
    isBot:      { type: Boolean, default: false },
    botReason:  { type: String, default: null },
    userAgent:  { type: String, default: "" },
    ip:         { type: String, default: "" },
    entryPage:  { type: String, default: "" },
    exitPage:   { type: String, default: "" },
    referrer:   { type: String, default: "" },
    source:     { type: String, default: "" },  // utm_source or parsed referrer domain
    medium:     { type: String, default: "" },  // utm_medium
    campaign:   { type: String, default: "" },  // utm_campaign
});
SessionSchema.index({ startedAt: -1 });
SessionSchema.index({ isBot: 1, startedAt: -1 });

// ── Conversion ────────────────────────────────────────────────────────────────
// One document per conversion event (e.g. demo_booked).
const ConversionSchema = new mongoose.Schema({
    sessionId:       { type: String, required: true, index: true },
    conversionEvent: { type: String, required: true },
    page:            { type: String, default: "" },
    occurredAt:      { type: Date, default: Date.now },
    source:          { type: String, default: "" },   // copied from Session on write
    referrer:        { type: String, default: "" },
    ip:              { type: String, default: "" },
});
ConversionSchema.index({ occurredAt: -1 });
ConversionSchema.index({ conversionEvent: 1, occurredAt: -1 });

export const PageView   = PremierPrinting.model("AnalyticsPageView",  PageViewSchema,   "analytics_pageviews");
export const Session    = PremierPrinting.model("AnalyticsSession",   SessionSchema,    "analytics_sessions");
export const Conversion = PremierPrinting.model("AnalyticsConversion",ConversionSchema, "analytics_conversions");
