import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-org OAuth connection to a sales/shopping channel (Google Merchant Center first, then
// Microsoft/Meta/Pinterest/TikTok…). Tokens are stored ENCRYPTED at rest (AES-256-GCM via the
// channel services). One row per (org, channel).
const schema = new mongoose.Schema({
    orgId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel:      { type: String, required: true },   // google | microsoft | meta | pinterest | tiktok
    status:       { type: String, enum: ["connected", "disconnected", "error"], default: "connected" },
    accessToken:  { type: String },                    // encrypted (OAuth2 access token, or OAuth1 oauth_token)
    refreshToken: { type: String },                    // encrypted
    // OAuth 1.0a (X): the permanent token secret used to sign every request, + temp request-token
    // state held between connect → callback.
    oauth1TokenSecret:   { type: String },             // encrypted
    oauth1RequestToken:  { type: String },
    oauth1RequestSecret: { type: String },             // encrypted
    connectSlug:    { type: String },                  // return-redirect context captured at connect
    connectPremier: { type: Boolean },
    expiresAt:    { type: Date },
    accountId:    { type: String },                    // merchant/account id at the channel
    adsCustomerId:{ type: String },                    // ads account id (for ad-spend auto-pull)
    scope:        { type: String },
    connectedBy:  { type: String },
    postedIds:    { type: [String], default: [] },     // X auto-post: product ids already tweeted
    lastSyncAt:   { type: Date },
    lastSyncResult: { type: mongoose.Schema.Types.Mixed },  // { synced, failed, error }
}, { timestamps: true });

schema.index({ orgId: 1, channel: 1 }, { unique: true });

export default PlatformDB.model("StorefrontChannelConnection", schema);
