import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { InkFormula } from "@pythias/mongo";
import { hexToLab } from "@/lib/color";

async function orgIdOr401() {
    const session = await getServerSession(authOptions);
    if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    return { orgId: session.user.orgId };
}

// Keep only valid components ({ base, percent > 0 }) and coerce types.
function cleanComponents(components) {
    return (Array.isArray(components) ? components : [])
        .filter((c) => c && c.base)
        .map((c) => ({ base: c.base, percent: Number(c.percent) || 0 }))
        .filter((c) => c.percent > 0);
}

export async function GET() {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const formulas = await InkFormula.find({ orgId })
        .sort({ name: 1 })
        .populate("components.base", "name code hex costPerGram")
        .lean();
    return NextResponse.json({ formulas });
}

export async function POST(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const { name, pantone, targetHex, components, substrate, notes } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const created = await InkFormula.create({
        orgId,
        name: name.trim(),
        pantone: pantone?.trim() || undefined,
        targetHex: targetHex || undefined,
        targetLab: targetHex ? hexToLab(targetHex) : undefined,
        components: cleanComponents(components),
        substrate: substrate?.trim() || undefined,
        notes: notes?.trim() || undefined,
    });
    const formula = await InkFormula.findById(created._id).populate("components.base", "name code hex costPerGram").lean();
    return NextResponse.json({ formula });
}

export async function PUT(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const body = await req.json();
    const { _id } = body;
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const set = {};
    if (body.name !== undefined) set.name = body.name.trim();
    if (body.pantone !== undefined) set.pantone = body.pantone?.trim() || null;
    if (body.substrate !== undefined) set.substrate = body.substrate?.trim() || null;
    if (body.notes !== undefined) set.notes = body.notes?.trim() || null;
    if (body.components !== undefined) set.components = cleanComponents(body.components);
    if (body.targetHex !== undefined) { set.targetHex = body.targetHex || null; set.targetLab = body.targetHex ? hexToLab(body.targetHex) : null; }
    const updated = await InkFormula.findOneAndUpdate({ _id, orgId }, { $set: set }, { new: true })
        .populate("components.base", "name code hex costPerGram")
        .lean();
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ formula: updated });
}

export async function DELETE(req) {
    const { orgId, error } = await orgIdOr401();
    if (error) return error;
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const res = await InkFormula.deleteOne({ _id, orgId });
    return NextResponse.json({ ok: res.deletedCount > 0 });
}
