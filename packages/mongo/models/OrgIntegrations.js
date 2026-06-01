import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },

    // ── Business info ──────────────────────────────────────────────
    businessAddress: {
        name: { type: String, default: "" },
        businessName: { type: String, default: "" },
        address1: { type: String, default: "" },
        address2: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        country: { type: String, default: "US" },
        emailAddress: { type: String, default: "" },
        phone: { type: String, default: "" },
    },

    // ── Internal server ────────────────────────────────────────────
    localIP: { type: String, default: "" },
    localKey: { type: String, default: "" },

    // ── ShipStation ────────────────────────────────────────────────
    shipstation: {
        apiKey: { type: String, default: "" },
        apiSecret: { type: String, default: "" },
        v2Key: { type: String, default: "" },
    },

    // ── USPS ───────────────────────────────────────────────────────
    usps: {
        clientId: { type: String, default: "" },
        clientSecret: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        crid: { type: String, default: "" },
        mid: { type: String, default: "" },
        manifestMid: { type: String, default: "" },
    },

    // ── UPS ────────────────────────────────────────────────────────
    ups: {
        clientId: { type: String, default: "" },
        clientSecret: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        accountZulily: { type: String, default: "" },
        accountTSC: { type: String, default: "" },
    },

    // ── Endicia / Stamps ───────────────────────────────────────────
    endicia: {
        requesterId: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        passPhrase: { type: String, default: "" },
    },

    // ── FedEx ──────────────────────────────────────────────────────
    fedex: {
        accountNumber: { type: String, default: "" },
        meterNumber: { type: String, default: "" },
        key: { type: String, default: "" },
    },

    // ── Shopify ────────────────────────────────────────────────────
    shopify: {
        storeUrl: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        apiKey: { type: String, default: "" },
        apiSecret: { type: String, default: "" },
        webhookSecret: { type: String, default: "" },
    },

    // ── Walmart ────────────────────────────────────────────────────
    walmart: {
        clientId: { type: String, default: "" },
        clientSecret: { type: String, default: "" },
        channelType: { type: String, default: "" },
    },

    // ── Etsy ───────────────────────────────────────────────────────
    etsy: {
        apiKey: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
        shopId: { type: String, default: "" },
    },

    // ── TikTok Shop ────────────────────────────────────────────────
    tiktok: {
        appId: { type: String, default: "" },
        appKey: { type: String, default: "" },
        appSecret: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
        shopId: { type: String, default: "" },
    },

    // ── Amazon ────────────────────────────────────────────────────
    amazon: {
        sellerId: { type: String, default: "" },
        accessKey: { type: String, default: "" },
        secretKey: { type: String, default: "" },
        marketplaceId: { type: String, default: "ATVPDKIKX0DER" },
        lwaClientId: { type: String, default: "" },
        lwaClientSecret: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
    },

    // ── eBay ──────────────────────────────────────────────────────
    ebay: {
        appId: { type: String, default: "" },
        certId: { type: String, default: "" },
        devId: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
    },

    // ── Faire ─────────────────────────────────────────────────────
    faire: {
        applicationId: { type: String, default: "" },
        secretId: { type: String, default: "" },
    },

    // ── Acenda ────────────────────────────────────────────────────
    acenda: {
        clientId: { type: String, default: "" },
        clientSecret: { type: String, default: "" },
        organization: { type: String, default: "" },
    },

    // ── Mirakl ────────────────────────────────────────────────────
    mirakl: {
        shopUrl: { type: String, default: "" },
        apiKey: { type: String, default: "" },
        sellerId: { type: String, default: "" },
        sellerCompanyId: { type: String, default: "" },
    },

    // ── ChannelEngine ─────────────────────────────────────────────
    channelengine: {
        apiUrl: { type: String, default: "" },
        apiKey: { type: String, default: "" },
    },

    // ── Wasabi / S3 ────────────────────────────────────────────────
    wasabi: {
        keyId: { type: String, default: "" },
        secret: { type: String, default: "" },
        bucket: { type: String, default: "" },
        region: { type: String, default: "us-east-1" },
    },

    // ── Production settings ────────────────────────────────────────
    production: {
        dtfPrinters: [{ type: String }],
        shippingStations: [{ type: String }],
        embroideryMachines: [{ type: String }],
        tajimaIpMap: { type: Object, default: {} },
    },

    // ── Printers ──────────────────────────────────────────────────
    shippingLabelPrinters: [{
        name: { type: String, default: "" },
        ipAddress: { type: String, default: "" },
        port: { type: String, default: "9100" },
        format: { type: String, enum: ["ZPL", "PDF"], default: "ZPL" },
    }],
    productionLabelPrinters: [{
        name: { type: String, default: "" },
        ipAddress: { type: String, default: "" },
        port: { type: String, default: "9100" },
        format: { type: String, enum: ["ZPL", "PDF"], default: "ZPL" },
    }],

    // ── Scales ────────────────────────────────────────────────────
    scales: [{
        name: { type: String, default: "" },
        ipAddress: { type: String, default: "" },
        port: { type: String, default: "8080" },
        model: { type: String, default: "" },
    }],
}, { timestamps: true });

schema.index({ orgId: 1 });

export default PlatformDB.model("OrgIntegrations", schema);
