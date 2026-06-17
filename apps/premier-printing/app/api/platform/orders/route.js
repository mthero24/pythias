import { NextResponse } from "next/server";
import { Order, Item, Blank } from "@pythias/mongo";
import { logActivity } from "@pythias/backend/server";
import { generatePieceID } from "@pythias/integrations";

// Ingest endpoint for orders routed to Premier by the Pythias platform (Commerce Cloud).
// Server-to-server: authenticated by a shared secret, NOT a user session.
// Items arrive as NAMES (styleCode/colorName/sizeName) + inline design artwork — the
// platform's ObjectIds are meaningless in this DB, so we re-resolve the blank locally.

const eq = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

async function uniquePieceId() {
    let id, exists = true;
    while (exists) { id = generatePieceID(); exists = await Item.exists({ pieceId: id }); }
    return id;
}

// Resolve a Premier blank (+ color/size refs) from the garment identity the platform sent.
// Prefer the MANUFACTURER STYLE (provider-agnostic) and fall back to the style code.
async function resolveLocalBlank(manufacturerStyle, styleCode, colorName, sizeName) {
    const mfr  = manufacturerStyle ? String(manufacturerStyle).trim() : null;
    const code = styleCode ? String(styleCode).trim() : null;
    if (!mfr && !code) return {};
    const or = [];
    if (mfr)  or.push({ manufacturerStyle: mfr });
    if (code) or.push({ code });
    const blank = await Blank.findOne({ $or: or })
        .populate("colors", "name sku")
        .select("code manufacturerStyle colors sizes")
        .lean();
    if (!blank) return {};
    const color = (blank.colors ?? []).find((c) => eq(c.name, colorName) || eq(c.sku, colorName)) ?? null;
    const sizeEntry = (blank.sizes ?? []).find((s) => eq(s.name, sizeName) || eq(s.sku, sizeName)) ?? null;
    return {
        blank: blank._id,
        color: color?._id ?? null,
        size:  sizeEntry?._id ?? null,
        sizeName: sizeEntry?.name ?? sizeName ?? "",
    };
}

export async function POST(request) {
    const secret = request.headers.get("x-pythias-secret");
    if (!process.env.PROVIDER_INGEST_SECRET || secret !== process.env.PROVIDER_INGEST_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json().catch(() => null);
    if (!data?.poNumber || !Array.isArray(data.items) || !data.items.length) {
        return NextResponse.json({ error: "poNumber and items are required" }, { status: 400 });
    }

    // Idempotency — don't double-ingest the same routed order
    const existing = await Order.findOne({ poNumber: data.poNumber, marketplace: "Commerce Cloud" }).select("_id").lean();
    if (existing) {
        return NextResponse.json({ success: true, alreadyIngested: true, orderId: existing._id.toString() });
    }

    const now = new Date();
    const orderId = data.orderId || `CC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const order = new Order({
        orderId,
        poNumber:      data.poNumber,
        uniquePo:      `${data.poNumber}-${orderId}-commerce-cloud`,
        marketplace:   "Commerce Cloud",
        status:        "awaiting_shipment",
        paid:          true,
        date:          now,
        shipByDate:    data.shipByDate ? new Date(data.shipByDate) : null,
        shippingType:  data.shippingType || "Standard",
        total:         data.total ?? 0,
        shippingCost:  data.shippingCost ?? 0,
        discountAmount: data.discountAmount ?? 0,
        discountName:  data.discountName || undefined,
        customerEmail: data.customerEmail || "",
        shippingAddress: {
            name:     data.shippingAddress?.name     || "not provided",
            phone:    data.shippingAddress?.phone    || "",
            address1: data.shippingAddress?.address1 || "not provided",
            address2: data.shippingAddress?.address2 || "",
            city:     data.shippingAddress?.city     || "not provided",
            state:    data.shippingAddress?.state    || "",
            zip:      data.shippingAddress?.zip      || "",
            country:  data.shippingAddress?.country  || "US",
        },
        // Seller's return address — provider ships blind under the seller's brand.
        ...(data.returnAddress ? { returnAddress: data.returnAddress } : {}),
    });

    const itemIds = [];
    for (const line of data.items) {
        const qty = Math.max(1, parseInt(line.quantity) || 1);
        const local = await resolveLocalBlank(line.manufacturerStyle, line.styleCode, line.colorName, line.sizeName);
        // "Create your own" custom artwork: build the per-location design map from the placement sides
        // when no pre-made design map was sent. The per-side `place` (normalized) drives DTF/GTX sizing.
        const sides = line.personalization?.sides || [];
        const designMap = (line.design && Object.keys(line.design).length)
            ? line.design
            : Object.fromEntries(sides.filter((s) => s.artworkUrl && s.location).map((s) => [s.location, s.artworkUrl]));
        const isCustom = !local.blank || sides.length > 0;
        for (let u = 0; u < qty; u++) {
            const item = new Item({
                pieceId:     await uniquePieceId(),
                status:      "awaiting_shipment",
                paid:        true,
                custom:      isCustom,
                order:       order._id,
                orderId,
                poNumber:    data.poNumber,
                sku:         line.sku || "",
                blank:       local.blank || null,
                color:       local.color || null,
                size:        local.size  || null,
                styleCode:   line.styleCode || "",
                colorName:   line.colorName || "",
                sizeName:    local.sizeName || line.sizeName || "",
                price:       line.price ?? 0,
                discount:    line.discount ?? 0,
                quantity:    "1",
                type:        line.printType || "",
                design:      designMap && Object.keys(designMap).length ? designMap : undefined,
                personalization: line.personalization || undefined,   // carries per-side normalized placement
                designRef:   null,
                date:        now,
                shipByDate:  data.shipByDate ? new Date(data.shipByDate) : null,
            });
            await item.save();
            itemIds.push(item._id);
        }
    }

    order.items = itemIds;
    await order.save();

    logActivity({ action: "order_received", entity: "order", entityId: order._id, entityName: data.poNumber || "", userName: "commerce-cloud", provider: "premierPrinting" });

    return NextResponse.json({ success: true, orderId: order._id.toString(), poNumber: data.poNumber, items: itemIds.length }, { status: 201 });
}
