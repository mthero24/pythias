export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSite } from "@pythias/mongo";

// POST /api/internal/storefront/migrate-indexes — one-shot: drop the stale UNIQUE index on
// StorefrontSite.orgId (multi-store now allows several sites per org) and ensure a plain index.
// Idempotent. Shared-secret guarded. Run once after deploying multi-store.
export async function POST(req) {
    if (!process.env.PYTHIAS_INTERNAL_KEY || req.headers.get("x-pythias-internal-key") !== process.env.PYTHIAS_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const coll = StorefrontSite.collection;
        const actions = [];
        for (const idx of await coll.indexes()) {
            // a single-field UNIQUE index on orgId is the stale one that blocks multiple stores/org
            if (idx.unique && idx.key && Object.keys(idx.key).length === 1 && idx.key.orgId === 1) {
                await coll.dropIndex(idx.name); actions.push(`dropped unique index ${idx.name}`);
            }
        }
        await coll.createIndex({ orgId: 1 }); actions.push("ensured non-unique orgId index");
        const indexes = (await coll.indexes()).map((i) => ({ name: i.name, key: i.key, unique: !!i.unique }));
        return NextResponse.json({ error: false, actions, indexes });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
