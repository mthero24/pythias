import { Settings } from "@pythias/mongo";

const cache = new Map();
const TTL = 30_000;

export async function getSetting(key, envFallback) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) return hit.v ?? envFallback;

    const doc = await Settings.findOne({ key }).lean().catch(() => null);
    const v = doc?.value ?? null;
    cache.set(key, { v, ts: Date.now() });
    return v ?? envFallback;
}

export function clearSettingCache(key) {
    if (key) cache.delete(key);
    else cache.clear();
}
