import { NextResponse } from "next/server";
import { PlatformDesign } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { notifyPartner } from "@/lib/notifyPartner";
import { shapeDesign } from "@/lib/partnerShape";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const PER_PAGE = 48;

    const filter = q
        ? { orgId: token.orgId, $or: [{ sku: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }] }
        : { orgId: token.orgId };

    const [designs, count] = await Promise.all([
        PlatformDesign.find(filter).sort({ _id: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        PlatformDesign.countDocuments(filter),
    ]);

    return NextResponse.json({ error: false, designs, count });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const design = (body && typeof body === "object" && !Array.isArray(body) && body.design && typeof body.design === "object")
        ? body.design
        : (body && typeof body === "object" && !Array.isArray(body) ? body : {});
    design.orgId = token.orgId;

    if (!design.sku) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        design.sku = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }
    if (!design.name) {
        design.name = `New Design ${design.sku}`;
    }

    try {
        let saved;
        if (design._id) {
            saved = await PlatformDesign.findOneAndUpdate(
                { _id: design._id, orgId: token.orgId },
                design,
                { new: true },
            );
        } else {
            saved = await PlatformDesign.create(design);
        }
        notifyPartner(token.orgId, "design.updated", shapeDesign(saved.toObject ? saved.toObject() : saved));
        return NextResponse.json({ error: false, design: saved });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { design, oldSku } = await req.json();
    if (!design?._id) return NextResponse.json({ error: true, msg: "Missing design id" }, { status: 400 });

    const orgId = token.orgId;

    // Only set fields that belong in the schema; cast blanks to ObjectId refs
    const update = {};
    const scalar = ["sku", "name", "description", "printType", "published", "active", "retailPrice", "cost"];
    for (const k of scalar) if (design[k] !== undefined) update[k] = design[k];
    if (design.tags       !== undefined) update.tags             = design.tags;
    if (design.images     !== undefined) update.images           = design.images;
    if (design.sublimationImages !== undefined) update.sublimationImages = design.sublimationImages;
    if (design.embroideryFiles   !== undefined) update.embroideryFiles   = design.embroideryFiles;
    if (design.threadImages      !== undefined) update.threadImages      = design.threadImages;
    if (design.threadColors      !== undefined) update.threadColors      = design.threadColors;
    if (design.blanks !== undefined) {
        update.blanks = (design.blanks ?? []).map(bl => ({
            blank: bl.blank?._id ?? bl.blank,
            colors: (bl.colors ?? []).map(c => c?._id ? c._id.toString() : c?.toString?.() ?? c),
        }));
    }

    try {
        if (oldSku && oldSku !== design.sku) {
            const { PlatformProduct } = await import("@pythias/mongo");
            const products = await PlatformProduct.find({ orgId, design: design._id });
            for (const p of products) {
                if (p.sku) p.sku = p.sku.replace(oldSku, design.sku);
                for (const v of (p.variants ?? [])) {
                    if (v.sku) v.sku = v.sku.replace(oldSku, design.sku);
                }
                p.markModified("variants");
                await p.save();
            }
        }

        const saved = await PlatformDesign.findOneAndUpdate(
            { _id: design._id, orgId },
            { $set: update },
            { new: true, runValidators: false },
        );
        if (!saved) return NextResponse.json({ error: true, msg: "Design not found" }, { status: 404 });
        notifyPartner(orgId, "design.updated", shapeDesign(saved.toObject ? saved.toObject() : saved));
        return NextResponse.json({ error: false, design: saved });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    await PlatformDesign.findOneAndDelete({ _id: id, orgId: token.orgId });
    return NextResponse.json({ error: false });
}
