import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createHash, randomBytes } from "crypto";
import { PartnerApiKey, Organization } from "@pythias/mongo";

// GET — list keys for this org
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const keys = await PartnerApiKey.find({ orgId, active: true })
        .select("name keyPrefix lastUsedAt createdAt")
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ keys });
}

// POST — generate a new key
// Body: { name }
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Key name is required" }, { status: 400 });

    // Generate key: pk_live_ + 32 random hex chars
    const rawKey  = `pk_live_${randomBytes(20).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    await PartnerApiKey.create({
        orgId,
        name:      name.trim(),
        keyHash,
        keyPrefix: rawKey.slice(0, 16),
    });

    // Return the raw key ONCE — never stored in plaintext
    return NextResponse.json({ key: rawKey, prefix: rawKey.slice(0, 16), name: name.trim() }, { status: 201 });
}

// DELETE — revoke a key
// Body: { keyPrefix }
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { keyPrefix } = await req.json();
    await PartnerApiKey.updateOne({ orgId, keyPrefix }, { active: false });

    return NextResponse.json({ success: true });
}
