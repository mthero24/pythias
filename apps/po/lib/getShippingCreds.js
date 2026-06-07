import { Settings } from "@pythias/mongo";

let _cache = null;
let _cacheTs = 0;
const TTL = 30_000;

const KEYS = [
    "localIP", "localKey",
    "picklistLabelPrinters",
    "usps.clientId", "usps.clientSecret", "usps.accountNumber", "usps.crid", "usps.mid", "usps.manifestMid",
    "ups.clientId", "ups.clientSecret", "ups.accountNumber",
    "fedex.accountNumber", "fedex.clientId", "fedex.clientSecret",
    "endicia.requesterId", "endicia.accountNumber", "endicia.passPhrase",
    "shipstation.apiKey", "shipstation.apiSecret", "shipstation.v2Key",
    "dhl.accountNumber", "dhl.clientId", "dhl.clientSecret",
    "businessAddress.name", "businessAddress.businessName", "businessAddress.address1",
    "businessAddress.address2", "businessAddress.city", "businessAddress.state",
    "businessAddress.postalCode", "businessAddress.country", "businessAddress.emailAddress", "businessAddress.phone",
    "production",
    "productionLabelPrinters",
];

async function loadMap() {
    if (_cache && Date.now() - _cacheTs < TTL) return _cache;
    const docs = await Settings.find({ key: { $in: KEYS } }).lean().catch(() => []);
    _cache = Object.fromEntries(docs.map(d => [d.key, d.value]));
    _cacheTs = Date.now();
    return _cache;
}

function g(m, key, envFallback) {
    return m[key] || envFallback || "";
}

export async function getShippingCreds() {
    const m = await loadMap();

    const dhlClientId     = g(m, "dhl.clientId", "");
    const dhlClientSecret = g(m, "dhl.clientSecret", "");

    let businessAddress;
    const dbAddr = g(m, "businessAddress.address1", "");
    if (dbAddr) {
        businessAddress = {
            name:          g(m, "businessAddress.name", ""),
            businessName:  g(m, "businessAddress.businessName", ""),
            address1:      dbAddr,
            address2:      g(m, "businessAddress.address2", ""),
            city:          g(m, "businessAddress.city", ""),
            state:         g(m, "businessAddress.state", ""),
            postalCode:    g(m, "businessAddress.postalCode", ""),
            country:       g(m, "businessAddress.country", "US"),
            emailAddress:  g(m, "businessAddress.emailAddress", ""),
            phone:         g(m, "businessAddress.phone", ""),
        };
    } else {
        try { businessAddress = JSON.parse(process.env.businessAddress || "{}"); } catch { businessAddress = {}; }
    }

    return {
        businessAddress,
        localIP:  g(m, "localIP",  process.env.localIP),
        localKey: g(m, "localKey", process.env.localKey),
        enSettings: {
            requesterID:   g(m, "endicia.requesterId",  process.env.endiciaRequesterID),
            accountNumber: g(m, "endicia.accountNumber", process.env.endiciaAccountNUmber),
            passPhrase:    g(m, "endicia.passPhrase",    process.env.endiciaPassPhrase),
        },
        credentials: {
            clientId:      g(m, "usps.clientId",      process.env.uspsClientId),
            clientSecret:  g(m, "usps.clientSecret",  process.env.uspsClientSecret),
            accountNumber: g(m, "usps.accountNumber", process.env.accountNumber),
            crid:          g(m, "usps.crid",          process.env.uspsCRID),
            mid:           g(m, "usps.mid",           process.env.uspsMID),
            manifestMID:   g(m, "usps.manifestMid",   process.env.manifestMID),
        },
        credentialsFedExNew: {
            accountNumber: g(m, "fedex.accountNumber", process.env.AccountNumberFedEx),
            key:           g(m, "fedex.clientId",      process.env.ApiKeyFedEx),
            secret:        g(m, "fedex.clientSecret",  process.env.SecretKeyFedEx),
        },
        credentialsFedEx: {
            accountNumber: process.env.tpalfedexaccountnumber,
            meterNumber:   process.env.tpalfedexmeternumber,
            key:           process.env.tpalfedexkey,
            password:      process.env.tpalfedexpassword,
        },
        credentialsUPS: {
            accountNumber: g(m, "ups.accountNumber", process.env.UPSAccountNumber),
            clientID:      g(m, "ups.clientId",      process.env.UPSClientID),
            clientSecret:  g(m, "ups.clientSecret",  process.env.UPSClientSecret),
        },
        credentialsShipStation: {
            apiKey: g(m, "shipstation.v2Key", process.env.ssV2),
        },
        shipstationAuth: `${g(m, "shipstation.apiKey", process.env.ssApiKey)}:${g(m, "shipstation.apiSecret", process.env.ssApiSecret)}`,
        credentialsDHL: {
            accountNumber: g(m, "dhl.accountNumber", process.env.dhlAccount),
            basic: (dhlClientId && dhlClientSecret)
                ? Buffer.from(`${dhlClientId}:${dhlClientSecret}`).toString("base64")
                : process.env.dhlBasic,
        },
        carrierCodes: { usps: "se-186007" },
        warehouse_id: 13111,
        stations: (() => {
            try {
                const prod = JSON.parse(m["production"] || "{}");
                return (prod.shippingStations ?? []).map(s =>
                    typeof s === "string" ? { name: s, hasScale: true, format: "ZPL" } : { format: "ZPL", ...s }
                );
            } catch { return []; }
        })(),
        labelPrinters: (() => {
            try { return JSON.parse(m["productionLabelPrinters"] || "[]"); } catch { return []; }
        })(),
        picklistPrinters: (() => {
            try { return JSON.parse(m["picklistLabelPrinters"] || "[]"); } catch { return []; }
        })(),
    };
}
