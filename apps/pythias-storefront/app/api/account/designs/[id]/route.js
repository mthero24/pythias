export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSavedDesign } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// GET /api/account/designs/[id] — full saved design (for re-hydrating the studio).
export async function GET(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const design = await StorefrontSavedDesign.findOne({ _id: id, orgId: auth.orgId, customerId: auth.customer._id }).lean();
    if (!design) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: false, design });
}

// DELETE /api/account/designs/[id]
export async function DELETE(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await StorefrontSavedDesign.deleteOne({ _id: id, orgId: auth.orgId, customerId: auth.customer._id });
    return NextResponse.json({ error: false });
}
