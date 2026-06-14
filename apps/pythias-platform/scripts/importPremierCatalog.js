/**
 * Import Premier Printing's blank catalog into the Commerce Cloud platform.
 *
 * Premier's blanks live in the `premierprinting` DB (the premier-printing app's own
 * database). Commerce Cloud reads blanks from the platform app's blank catalog
 * (`platform` DB) and providers/catalog from the `pythias` DB. This script bridges
 * the gap by:
 *   1. Copying Premier's active blanks + their colors into the platform DB
 *      (preserving _ids so every ref — colors, image.color, sizes — stays valid).
 *   2. Registering `premier-printing` as a Commerce Cloud provider in the pythias DB.
 *   3. Seeding ProviderCatalog (premier-printing) from the imported blanks.
 *   4. Removing the stale `test-provider-cc` provider + its catalog entries.
 *
 * Idempotent — safe to re-run. Re-importing picks up Premier catalog changes.
 *
 * Run:  node apps/pythias-platform/scripts/importPremierCatalog.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const platEnv = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));
const premEnv = readEnv(path.join(ROOT, "apps/premier-printing/.env.local"));

// Prefer real env vars (production / PM2), fall back to the apps' .env.local (local dev).
const SRC_URI      = process.env.premierPrintingMongoURL || premEnv.mongoURL || platEnv.premierPrintingMongoURL;          // premierprinting — Premier's blanks
const PLATFORM_URI = process.env.PLATFORM_MONGO_URL || process.env.platformMongoURL || process.env.mongoURL || platEnv.mongoURL; // platform — CC blank catalog
const PYTHIAS_URI  = process.env.pythiasMongoURL || platEnv.pythiasMongoURL;     // pythias — providers / ProviderCatalog

const PROVIDER = { slug: "premier-printing", name: "Premier Printing", zip: "48326", state: "MI", region: "midwest", country: "US", leadTimeDays: 2 };
const DEFAULT_WHOLESALE_CENTS = 1200;
const DEFAULT_WHOLESALE_DOLLARS = DEFAULT_WHOLESALE_CENTS / 100;
const IMPORT_TAG = "premier-printing";

// Wholesale (dollars) the provider sells the blank for: prefer Premier's wholesalePrice;
// if unset, mark up wholesaleCost by 200% (×3); else 0 (callers apply a flat default).
function wholesaleDollars(size) {
    if (size?.wholesalePrice > 0) return size.wholesalePrice;
    if (size?.wholesaleCost > 0)  return size.wholesaleCost * 3;
    return 0;
}

async function main() {
    console.log(`[catalog-sync] starting at ${new Date().toISOString()}`);
    if (!SRC_URI || !PLATFORM_URI || !PYTHIAS_URI) throw new Error("Missing Mongo URIs — set premierPrintingMongoURL / mongoURL / pythiasMongoURL (env or .env.local)");

    const src  = await mongoose.createConnection(SRC_URI).asPromise();
    const plat = await mongoose.createConnection(PLATFORM_URI).asPromise();
    const pyth = await mongoose.createConnection(PYTHIAS_URI).asPromise();
    console.log(`Connected — source=${src.name}  platform=${plat.name}  providers=${pyth.name}`);

    // ── 1. Load Premier's active blanks (with colors) ────────────────────────
    const blanks = await src.collection("blanks")
        .find({ active: { $ne: false }, colors: { $exists: true, $ne: [] } })
        .toArray();
    console.log(`\nPremier active blanks with colors: ${blanks.length}`);

    const colorIds = [...new Set(blanks.flatMap(b => (b.colors || []).map(String)))]
        .map(id => new mongoose.Types.ObjectId(id));
    const colors = await src.collection("colors").find({ _id: { $in: colorIds } }).toArray();
    console.log(`Referenced colors: ${colors.length}`);

    // ── 2. Copy colors → platform DB (preserve _id) ──────────────────────────
    let colorsUpserted = 0;
    for (const c of colors) {
        const fields = { ...c }; delete fields._id; delete fields.__v;
        fields.importSource = IMPORT_TAG;
        await plat.collection("colors").updateOne({ _id: c._id }, { $set: fields }, { upsert: true });
        colorsUpserted++;
    }
    console.log(`Colors upserted into platform: ${colorsUpserted}`);

    // ── 3. Copy blanks → platform DB (preserve _id) ──────────────────────────
    let blanksUpserted = 0;
    for (const b of blanks) {
        const fields = { ...b }; delete fields._id; delete fields.__v;
        fields.importSource = IMPORT_TAG;
        fields.active = true;
        // These are provider source garments, NOT a seller's catalog alias.
        delete fields.catalogBlank;
        delete fields.orgId;
        // Normalize wholesalePrice on each size so product creation (which reads
        // size.wholesalePrice / size.retailPrice) and the alias copy are correct.
        fields.sizes = (b.sizes ?? []).map((s) => ({ ...s, wholesalePrice: wholesaleDollars(s) || DEFAULT_WHOLESALE_DOLLARS }));
        await plat.collection("blanks").updateOne({ _id: b._id }, { $set: fields }, { upsert: true });
        blanksUpserted++;
    }
    console.log(`Blanks upserted into platform: ${blanksUpserted}`);

    // ── 4. Register premier-printing provider (pythias DB) ───────────────────
    const orgsCol = pyth.collection("organizations");
    let org = await orgsCol.findOne({ slug: PROVIDER.slug });
    if (!org) {
        const r = await orgsCol.insertOne({
            name: PROVIDER.name, slug: PROVIDER.slug, orgType: "fulfillment",
            tier: "enterprise", status: "active", billingEmail: "ops@pythiastechnologies.com",
            createdAt: new Date(), updatedAt: new Date(),
        });
        org = { _id: r.insertedId };
        console.log(`\nCreated provider org premier-printing (${org._id})`);
    } else {
        await orgsCol.updateOne({ _id: org._id }, { $set: { orgType: "fulfillment", status: "active" } });
        console.log(`\nProvider org premier-printing exists (${org._id})`);
    }
    const providerId = org._id;

    await pyth.collection("providercapacities").updateOne(
        { providerId },
        { $set: { acceptsCommerceCloud: true, autoAccept: true, warmupMode: false, maxDailyOrders: 1000, isPaused: false, allowOverflowIn: true, allowOverflowOut: true, updatedAt: new Date() },
          $setOnInsert: { currentDailyCount: 0, createdAt: new Date() } },
        { upsert: true }
    );
    await pyth.collection("providerlocations").updateOne(
        { providerId, isPrimary: true },
        { $set: { zip: PROVIDER.zip, state: PROVIDER.state, region: PROVIDER.region, country: PROVIDER.country, isPrimary: true, shipsToCountries: [], updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
    );
    await pyth.collection("providerscores").updateOne(
        { providerId },
        { $set: { onTimeRate30d: 0.97, defectRate30d: 0.01, avgShipDays30d: PROVIDER.leadTimeDays, score: 92, lastCalculated: new Date(), updatedAt: new Date() },
          $setOnInsert: { totalFulfilled: 0, createdAt: new Date() } },
        { upsert: true }
    );
    console.log("Provider capacity / location / score upserted.");

    // ── 5. Seed ProviderCatalog (premier-printing) ───────────────────────────
    const catCol = pyth.collection("providercatalogs");
    let created = 0, updated = 0, skipped = 0;
    // Pricing: wholesalePrice (what Premier sells the blank for) = CC cost basis. Missing →
    // wholesaleCost +200% (×3) → flat default. retailPrice = Premier's retail (CC default retail).
    let priceFromWP = 0, priceFromWC = 0, priceDefault = 0;
    for (const b of blanks) {
        if (!b.colors?.length || !b.sizes?.length) { skipped++; continue; }
        for (const colorId of b.colors) {
            for (const size of b.sizes) {
                if (!size?.name || size.hidden) continue;
                let wholesalePrice;
                if (size.wholesalePrice > 0)      { wholesalePrice = Math.round(size.wholesalePrice * 100); priceFromWP++; }
                else if (size.wholesaleCost > 0)  { wholesalePrice = Math.round(size.wholesaleCost * 3 * 100); priceFromWC++; }
                else                              { wholesalePrice = DEFAULT_WHOLESALE_CENTS;                priceDefault++; }
                const retailPrice = size.retailPrice > 0 ? Math.round(size.retailPrice * 100) : undefined;
                const filter = { providerId, blankId: b._id, colorId: new mongoose.Types.ObjectId(String(colorId)), size: size.name };
                const res = await catCol.updateOne(
                    filter,
                    { $set: { wholesalePrice, retailPrice, currency: "USD", leadTimeDays: PROVIDER.leadTimeDays, active: true, updatedAt: new Date() },
                      $setOnInsert: { createdAt: new Date() } },
                    { upsert: true }
                );
                if (res.upsertedCount) created++; else updated++;
            }
        }
    }
    console.log(`\nProviderCatalog — created: ${created}, updated: ${updated}, blanks skipped (no colors/sizes): ${skipped}`);
    console.log(`Pricing source — from wholesalePrice: ${priceFromWP}, fell back to wholesaleCost: ${priceFromWC}, flat default: ${priceDefault}`);

    // ── 5b. Deactivate drift — blanks no longer active in Premier can't be sold ─
    // A blank that went inactive (or was deleted) in Premier after a prior import
    // must be pulled from sale: deactivate its platform blank + ProviderCatalog rows.
    const activeIds = new Set(blanks.map(b => b._id.toString()));
    const importedBlanks = await plat.collection("blanks")
        .find({ importSource: IMPORT_TAG }).project({ _id: 1, code: 1, active: 1 }).toArray();
    const drifted = importedBlanks.filter(b => !activeIds.has(b._id.toString()));
    let deactBlanks = 0, deactCatalog = 0;
    for (const b of drifted) {
        if (b.active !== false) {
            await plat.collection("blanks").updateOne({ _id: b._id }, { $set: { active: false } });
            deactBlanks++;
        }
        const r = await catCol.updateMany({ providerId, blankId: b._id, active: true }, { $set: { active: false, updatedAt: new Date() } });
        deactCatalog += r.modifiedCount;
    }
    console.log(`Drift deactivated — blanks: ${deactBlanks}, catalog rows: ${deactCatalog}` + (drifted.length ? ` (codes: ${drifted.map(b => b.code).join(", ")})` : ""));

    // ── 5c. Seed Premier print types into each Commerce Cloud seller's edit-data ─
    // Print types live in PlatformEditData (collection "editdatas"), org-scoped and
    // seller-editable. Seed Premier's set with default prices; never clobber a price a
    // seller has already set (only fill when missing/zero). Product build adds the
    // print-type price onto both wholesale and retail.
    const premierPrintTypes = await src.collection("PrintTypes").find({}).toArray();
    const ptDefs = premierPrintTypes
        .filter(p => p.name)
        .map(p => ({ name: String(p.name).trim(), price: Number(p.price) || 0 }));
    const commerceOrgs = await orgsCol.find({ orgType: "commerce" }).project({ _id: 1, slug: 1 }).toArray();
    const editCol = plat.collection("editdatas");
    let ptSeeded = 0, ptFilled = 0;
    for (const o of commerceOrgs) {
        for (const pt of ptDefs) {
            const existing = await editCol.findOne({ orgId: o._id, type: "printTypes", name: pt.name });
            if (!existing) {
                await editCol.insertOne({ orgId: o._id, type: "printTypes", name: pt.name, price: pt.price });
                ptSeeded++;
            } else if (existing.price == null || existing.price === 0) {
                if (pt.price > 0) { await editCol.updateOne({ _id: existing._id }, { $set: { price: pt.price } }); ptFilled++; }
            }
        }
    }
    console.log(`Print types — seeded: ${ptSeeded}, prices filled: ${ptFilled}, across ${commerceOrgs.length} commerce org(s) (defs: ${ptDefs.map(p => `${p.name}=$${p.price}`).join(", ")})`);

    // ── 5d. Re-price existing seller catalog aliases from current source pricing ─
    // Keeps every seller's catalog in sync when Premier changes wholesale/retail. Cost basis
    // (wholesalePrice/costPerItem/platformPrice) always refreshes; retail only refreshes when
    // the seller hasn't set their own (retailOverridden). Does NOT touch already-built products.
    const aliases = await plat.collection("blanks").find({ catalogBlank: true }).toArray();
    let aliasRepriced = 0;
    for (const a of aliases) {
        const srcIds = (a.blanks ?? []).map((id) => new mongoose.Types.ObjectId(String(id)));
        if (!srcIds.length) continue;
        const srcs = await plat.collection("blanks").find({ _id: { $in: srcIds } }).project({ sizes: 1 }).toArray();
        const srcSize = {};
        for (const s of srcs) for (const z of (s.sizes ?? [])) { const k = String(z.name).trim().toLowerCase(); if (!srcSize[k]) srcSize[k] = z; }
        const newSizes = (a.sizes ?? []).map((sz) => {
            const s = srcSize[String(sz.name).trim().toLowerCase()] ?? {};
            const cost = (s.wholesalePrice ?? 0) || DEFAULT_WHOLESALE_DOLLARS;
            return {
                ...sz,
                wholesalePrice: cost,
                wholesaleCost:  cost,
                costPerItem:    cost,
                retailPrice:    a.retailOverridden ? (sz.retailPrice ?? 0) : (s.retailPrice ?? sz.retailPrice ?? 0),
                compareAtPrice: s.compareAtPrice ?? sz.compareAtPrice ?? 0,
                weight:         s.weight ?? sz.weight ?? 0,
            };
        });
        const ent = await catCol.find({ active: true, blankId: { $in: srcIds } }).project({ wholesalePrice: 1 }).toArray();
        const platformPrice = ent.reduce((mx, e) => Math.max(mx, e.wholesalePrice ?? 0), 0) || a.platformPrice || 0;
        await plat.collection("blanks").updateOne({ _id: a._id }, { $set: { sizes: newSizes, platformPrice } });
        aliasRepriced++;
    }
    console.log(`Seller catalog aliases re-priced: ${aliasRepriced}`);

    // ── 6. Remove stale test-provider-cc data ────────────────────────────────
    const testOrg = await orgsCol.findOne({ slug: "test-provider-cc" });
    if (testOrg) {
        const delCat = await catCol.deleteMany({ providerId: testOrg._id });
        const delCap = await pyth.collection("providercapacities").deleteMany({ providerId: testOrg._id });
        await pyth.collection("providerlocations").deleteMany({ providerId: testOrg._id });
        await pyth.collection("providerscores").deleteMany({ providerId: testOrg._id });
        console.log(`\nCleaned test-provider-cc — catalog entries removed: ${delCat.deletedCount}, capacity removed: ${delCap.deletedCount}`);
    } else {
        console.log("\nNo test-provider-cc org found (nothing to clean).");
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const finalProviders = await pyth.collection("providercapacities").countDocuments({ acceptsCommerceCloud: true });
    const finalCatalog = await catCol.countDocuments({ providerId });
    console.log(`\n✔ Done. Eligible providers: ${finalProviders}. premier-printing catalog entries: ${finalCatalog}.`);

    await Promise.all([src.close(), plat.close(), pyth.close()]);
}

// Exit 0 even on failure so PM2 marks the run "stopped" (not "errored") and cron_restart
// fires reliably on the next schedule. The error is logged for monitoring.
main()
    .then(() => process.exit(0))
    .catch(e => { console.error("[catalog-sync] FAILED:", e); process.exit(0); });
