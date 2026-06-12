import { createHash } from "crypto";
import { PartnerApiKey, Organization } from "@pythias/mongo";

// Validates the Bearer token and returns { org, apiKey } or null
export async function validatePartnerKey(req) {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return null;
    const rawKey = auth.slice(7).trim();
    if (!rawKey.startsWith("pk_")) return null;

    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const apiKey  = await PartnerApiKey.findOne({ keyHash, active: true }).lean();
    if (!apiKey) return null;

    const org = await Organization.findById(apiKey.orgId).lean();
    if (!org) return null;

    // Fire-and-forget lastUsedAt update
    PartnerApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(() => {});

    return { org, apiKey };
}
