import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { InkBase } from "@pythias/mongo";
import { hexToLab } from "@/lib/color";

async function orgIdOr401() {
    const session = await getServerSession(authOptions);
    if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    return { orgId: session.user.orgId };
}

export async function GET() {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const bases = await InkBase.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ bases });
}

export async function POST(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const { name, code, hex, costPerGram } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const base = await InkBase.create({
        orgId,
        name: name.trim(),
        code: code?.trim() || undefined,
        hex: hex || undefined,
        lab: hex ? hexToLab(hex) : undefined,
        costPerGram: Number(costPerGram) || 0,
    });
    return NextResponse.json({ base });
}

export async function PUT(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const { _id, name, code, hex, costPerGram, active } = await req.json();
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const set = {};
    if (name !== undefined) set.name = name.trim();
    if (code !== undefined) set.code = code?.trim() || null;
    if (costPerGram !== undefined) set.costPerGram = Number(costPerGram) || 0;
    if (active !== undefined) set.active = !!active;
    if (hex !== undefined) { set.hex = hex || null; set.lab = hex ? hexToLab(hex) : null; }
    // Scope the update to this org so one tenant can't edit another's base.
    const base = await InkBase.findOneAndUpdate({ _id, orgId }, { $set: set }, { new: true }).lean();
    if (!base) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ base });
}

export async function DELETE(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const res = await InkBase.deleteOne({ _id, orgId });
    return NextResponse.json({ ok: res.deletedCount > 0 });
}
