import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformDesign as Design } from "@pythias/mongo";
import { shapeDesign } from "@/lib/partnerShape";

// GET /api/partner/designs/:sku  — single design by SKU
export async function GET(req, { params }) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { sku } = await params;
    const decoded = decodeURIComponent(sku ?? "").trim();
    if (!decoded) return NextResponse.json({ error: "sku required" }, { status: 400 });

    const design = await Design.findOne({ orgId, sku: decoded })
        .select("sku name description printType tags images embroideryFiles published")
        .lean();

    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    return NextResponse.json({ design: shapeDesign(design) });
}
