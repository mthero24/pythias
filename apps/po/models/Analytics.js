import mongoose from "mongoose";
import { TSPprints } from "@/lib/connection";

const PageViewSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, index: true },
    page:       { type: String, required: true },
    referrer:   { type: String, default: "" },
    enteredAt:  { type: Date, default: Date.now },
    timeOnPage: { type: Number, default: null },
    interacted: { type: Boolean, default: null },
    isBot:      { type: Boolean, default: false },
    botReason:  { type: String, default: null },
    userAgent:  { type: String, default: "" },
    ip:         { type: String, default: "" },
    vitals: {
        lcp:      Number,
        cls:      Number,
        ttfb:     Number,
        fcp:      Number,
        inp:      Number,
        loadTime: Number,
    },
});
PageViewSchema.index({ enteredAt: -1 });
PageViewSchema.index({ page: 1, enteredAt: -1 });
PageViewSchema.index({ isBot: 1, enteredAt: -1 });

const SessionSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, unique: true },
    startedAt:  { type: Date, default: Date.now },
    lastSeen:   { type: Date, default: Date.now },
    pages:      [String],
    totalTime:  { type: Number, default: 0 },
    isBot:      { type: Boolean, default: false },
    botReason:  { type: String, default: null },
    userAgent:  { type: String, default: "" },
    ip:         { type: String, default: "" },
    entryPage:  { type: String, default: "" },
    exitPage:   { type: String, default: "" },
    referrer:   { type: String, default: "" },
    source:     { type: String, default: "" },
    medium:     { type: String, default: "" },
    campaign:   { type: String, default: "" },
});
SessionSchema.index({ startedAt: -1 });
SessionSchema.index({ isBot: 1, startedAt: -1 });

export const PageView = TSPprints.model("AnalyticsPageView", PageViewSchema, "analytics_pageviews");
export const Session  = TSPprints.model("AnalyticsSession",  SessionSchema,  "analytics_sessions");
