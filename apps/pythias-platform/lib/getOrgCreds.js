import { OrgIntegrations } from "@pythias/mongo";

const cache = new Map();
const CACHE_TTL = 30_000; // 30s

export async function getOrgCreds(orgId) {
    const key = orgId.toString();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

    let doc = await OrgIntegrations.findOne({ orgId }).lean();
    if (!doc) {
        doc = await OrgIntegrations.create({ orgId });
        doc = doc.toObject();
    }

    cache.set(key, { data: doc, ts: Date.now() });
    return doc;
}

export function clearCredsCache(orgId) {
    cache.delete(orgId.toString());
}

// Convenience: build the shipping creds object expected by @pythias/shipping
export function buildShippingCreds(creds) {
    return {
        businessAddress: creds.businessAddress,
        enSettings: {
            requesterID: creds.endicia?.requesterId,
            accountNumber: creds.endicia?.accountNumber,
            passPhrase: creds.endicia?.passPhrase,
        },
        credentials: {
            clientId: creds.usps?.clientId,
            clientSecret: creds.usps?.clientSecret,
            accountNumber: creds.usps?.accountNumber,
            api: "apis",
        },
        credentialsUPS: {
            clientId: creds.ups?.clientId,
            clientSecret: creds.ups?.clientSecret,
            accountNumber: creds.ups?.accountNumber,
        },
        credentialsFedEx: {
            accountNumber: creds.fedex?.accountNumber,
            meterNumber: creds.fedex?.meterNumber,
            key: creds.fedex?.key,
        },
        ssAuth: `${creds.shipstation?.apiKey}:${creds.shipstation?.apiSecret}`,
        ssV2: creds.shipstation?.v2Key,
        localIP: creds.localIP,
        localKey: creds.localKey,
    };
}
