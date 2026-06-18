import crypto from "node:crypto";
import NetworkFraudEntry from "../models/NetworkFraudEntry";
import NetworkSuppression from "../models/NetworkSuppression";

// Shared network-protection core used by BOTH the storefront app (screen orders, suppress sends)
// and the backend services (seller dashboard, manual reports). Lives in @pythias/mongo so there's
// one implementation across the package boundary.

const norm = {
    email:   (v) => String(v || "").toLowerCase().trim(),
    phone:   (v) => String(v || "").replace(/\D/g, ""),
    ip:      (v) => String(v || "").trim(),
    address: (v) => String(v || "").toLowerCase().replace(/\s+/g, " ").trim(),
};
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");

function mask(type, v) {
    if (type === "email") { const [a, b] = v.split("@"); return `${(a || "").slice(0, 2)}***@${(b || "").slice(0, 2)}***`; }
    if (type === "phone" || type === "ip") return `***${v.slice(-4)}`;
    return `${v.slice(0, 6)}***`;
}

// Screen an incoming order against the network blocklist. Returns { level, score, reasons }.
// level: "ok" | "review" (sev 2) | "block" (sev 3). Bumps hit counters on matches.
export async function screenOrder({ email, phone, shippingAddress, ip } = {}) {
    const checks = [];
    if (email) checks.push(["email", norm.email(email)]);
    if (phone) checks.push(["phone", norm.phone(phone)]);
    if (ip)    checks.push(["ip", norm.ip(ip)]);
    if (shippingAddress?.address1) checks.push(["address", norm.address(`${shippingAddress.address1}|${shippingAddress.zip || shippingAddress.postalCode || ""}`)]);
    const valid = checks.filter(([, v]) => v);
    if (!valid.length) return { level: "ok", score: 0, reasons: [] };

    const ors = valid.map(([type, v]) => ({ type, valueHash: hash(v) }));
    const entries = await NetworkFraudEntry.find({ active: true, $or: ors }).lean();
    if (!entries.length) return { level: "ok", score: 0, reasons: [] };

    const maxSev = Math.max(...entries.map((e) => e.severity || 2));
    const reasons = entries.map((e) => `${e.type} on network blocklist (${e.reason || "reported"})`);
    await NetworkFraudEntry.updateMany({ _id: { $in: entries.map((e) => e._id) } }, { $inc: { hits: 1 }, $set: { lastSeen: new Date() } });
    return { level: maxSev >= 3 ? "block" : "review", score: maxSev, reasons };
}

// Add/strengthen a network blocklist entry (chargeback, manual report, velocity).
export async function reportNetworkFraud({ type, value, reason = "manual", orgId, severity = 3 } = {}) {
    const v = (norm[type] || norm.email)(value);
    if (!v) return null;
    return NetworkFraudEntry.findOneAndUpdate(
        { type, valueHash: hash(v) },
        {
            $setOnInsert: { type, valueHash: hash(v), masked: mask(type, v), firstSeen: new Date() },
            $set: { active: true, reason, lastSeen: new Date() },
            $max: { severity },
            $push: { reports: { orgId, at: new Date(), reason } },
        },
        { upsert: true, new: true }
    );
}

export async function isNetworkSuppressed(channel, value) {
    const v = channel === "sms" ? norm.phone(value) : norm.email(value);
    if (!v) return false;
    return !!(await NetworkSuppression.exists({ channel, valueHash: hash(v) }));
}

export async function recordNetworkSuppression({ channel, value, reason = "bounce", orgId } = {}) {
    const v = channel === "sms" ? norm.phone(value) : norm.email(value);
    if (!v) return null;
    return NetworkSuppression.findOneAndUpdate(
        { channel, valueHash: hash(v) },
        {
            $setOnInsert: { channel, valueHash: hash(v), masked: mask(channel === "sms" ? "phone" : "email", v), firstSeen: new Date() },
            $set: { reason, lastSeen: new Date() },
            $push: { reports: { orgId, at: new Date() } },
            $inc: { hits: 1 },
        },
        { upsert: true, new: true }
    );
}
