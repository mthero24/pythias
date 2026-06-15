/**
 * Seed a demo StorefrontSite for an org so the storefront has something to render.
 * Usage: node apps/pythias-storefront/scripts/seedDemoSite.js [orgSlug]   (default: commerce-test)
 * Idempotent — upserts by orgId.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const ROOT = path.resolve(__dirname, "../../..");
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, "apps/pythias-storefront/.env.local")));
const PYTHIAS_URI = env.pythiasMongoURL || env.PLATFORM_MONGO_URL || env.mongoURL;

const slug = process.argv[2] || "commerce-test";
const presetId = process.argv[3] || "editorial";

async function main() {
    const { applyPreset } = await import("@pythias/storefront/themes");
    const conn = await mongoose.createConnection(PYTHIAS_URI).asPromise();
    const org = await conn.collection("organizations").findOne({ slug });
    if (!org) throw new Error(`org '${slug}' not found`);

    const content = applyPreset(presetId, { name: org.name });
    if (!content) throw new Error(`unknown preset '${presetId}'`);

    const doc = {
        orgId: org._id,
        status: "published",
        subdomain: slug,
        siteType: "commerce",
        plan: "pro",
        aiEnabled: false,
        ...content,
        publishedAt: new Date(),
    };

    await conn.collection("storefrontsites").updateOne(
        { orgId: org._id },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
    );
    console.log(`✔ Seeded storefront for ${slug} (preset: ${presetId}, subdomain: ${slug})`);
    await conn.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
