import { NextResponse } from "next/server";
import { PlatformProduct } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

const PER_PAGE = 50;

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const active = url.searchParams.get("active");

    const filter = { orgId };
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }];
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;

    const [products, count] = await Promise.all([
        PlatformProduct.find(filter)
            .sort({ _id: -1 })
            .skip((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
            .populate("designRef", "sku name")
            .populate("blank", "code name")
            .lean(),
        PlatformProduct.countDocuments(filter),
    ]);

    return NextResponse.json({ error: false, products: JSON.parse(JSON.stringify(products)), count });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { product } = await req.json();
    product.orgId = token.orgId;

    try {
        const saved = await PlatformProduct.create(product);
        return NextResponse.json({ error: false, product: JSON.parse(JSON.stringify(saved)) });
    } catch (e) {
        return NextResponse.json({ error: e.message?.includes("duplicate") ? "SKU already exists" : e.message });
    }
}
