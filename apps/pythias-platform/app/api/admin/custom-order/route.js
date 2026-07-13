import { NextResponse } from "next/server";
import { PlatformOrder as Order, PlatformItem as Item, PlatformBlank as Blank } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { generatePieceID } from "@pythias/integrations";

async function uniquePieceId() {
    let id, exists = true;
    while (exists) {
        id = generatePieceID();
        exists = await Item.exists({ pieceId: id });
    }
    return id;
}

const eq = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Resolve the form's blank id + free-text color/size names into the same refs a storefront
// design-studio item carries (blank/color/size), plus the title and the pieces a SKU needs.
async function resolveCustomBlank(blankId, colorName, sizeName) {
    if (!blankId) return {};
    try {
        const blank = await Blank.findById(blankId).populate("colors", "name sku").select("code name colors sizes").lean();
        if (!blank) return {};
        const color = (blank.colors ?? []).find((c) => eq(c.name, colorName) || eq(c.sku, colorName)) ?? null;
        const sz    = (blank.sizes  ?? []).find((s) => eq(s.name, sizeName)  || eq(s.sku, sizeName))  ?? null;
        return {
            blank: blank._id, code: blank.code || "", name: blank.name || "",
            color: color?._id ?? null, colorSku: color?.sku ?? "",
            size: sz?._id ?? null, sizeSku: sz?.sku ?? "", sizeName: sz?.name ?? sizeName ?? "",
        };
    } catch { return {}; }
}

// Same SKU format the order pipeline uses (functions/pullOrders.js CreateSku); custom design token = "CUSTOM".
const customSku = (r) => (r.code && r.colorSku && r.sizeSku) ? `${r.code}_${r.colorSku}_${r.sizeSku}_CUSTOM` : "";

export async function GET(request) {
    const token  = await getToken({ req: request });
    const orgId  = token?.orgId;
    const { searchParams } = new URL(request.url);
    const q     = searchParams.get("q") || "";
    const skip  = parseInt(searchParams.get("skip") || "0");
    const limit = 25;

    const filter = { orgId, marketplace: { $in: ["custom order", "custom"] } };
    if (q) {
        filter.$or = [
            { poNumber:              { $regex: q, $options: "i" } },
            { "shippingAddress.name": { $regex: q, $options: "i" } },
            { customerEmail:         { $regex: q, $options: "i" } },
        ];
    }

    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate("items").lean(),
        Order.countDocuments(filter),
    ]);
    return NextResponse.json({ orders, total });
}

export async function POST(request) {
    const token = await getToken({ req: request });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const data  = await request.json();

    try {
    const subtotal       = (data.items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
    const discountAmount = subtotal * (data.discountPct || 0);
    const tax            = (subtotal - discountAmount) * (data.taxRate || 0);
    // total is the pre-discount figure; the order page shows total − discountAmount as the amount due.
    const total          = subtotal + (data.shippingCost || 0) + tax;
    const orderId  = `CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const embroideryFiles = (data.designs || [])
        .filter(d => d.location && d.dst)
        .map(d => ({ location: d.location, dst: d.dst }));

    const order = new Order({
        orgId,
        orderId,
        poNumber:      data.poNumber,
        marketplace:   "custom order",
        status:        "custom_pending",
        paid:          false,
        date:          new Date(),
        shipByDate:    data.dateNeeded ? new Date(data.dateNeeded) : null,
        shippingType:  data.inStorePickup ? "In-Store Pickup" : (data.shippingType || "Standard"),
        inStorePickup: !!data.inStorePickup,
        total,
        discountAmount,
        discountName:  data.discountName || (data.discountPct > 0 ? `${(data.discountPct * 100).toFixed(0)}% off` : undefined),
        shippingCost:  data.shippingCost || 0,
        taxRate:       data.taxRate      || 0,
        customerEmail: data.customerEmail || "",
        // Order schema requires name/address1/city/country (rejects empty strings). Custom orders
        // are often in-store pickup or invoiced-later with no address on hand, and the builder only
        // requires a PO number — so fall back to a pickup marker / placeholder to avoid a 500.
        shippingAddress: {
            name:     data.customer?.name     || data.customerEmail || "Custom Order",
            phone:    data.customer?.phone    || "",
            address1: data.customer?.address?.street  || (data.inStorePickup ? "In-Store Pickup" : "—"),
            address2: data.customer?.company  || "",
            city:     data.customer?.address?.city    || (data.inStorePickup ? "In-Store Pickup" : "—"),
            state:    data.customer?.address?.state   || "",
            zip:      data.customer?.address?.zip     || "",
            country:  data.customer?.address?.country || "US",
        },
        notes:           data.notes ? [{ note: data.notes, date: new Date(), userName }] : [],
        embroideryFiles: embroideryFiles.length ? embroideryFiles : [],
    });

    // DST map from order-level designs { locationName: dstUrl }
    const dstMap = {};
    for (const d of (data.designs || [])) {
        if (d.location && d.dst) dstMap[d.location] = d.dst;
    }
    const dstFileObj = Object.keys(dstMap).length ? dstMap : null;

    const itemIds = [];
    for (const line of (data.items || [])) {
        const qty = Math.max(1, parseInt(line.quantity) || 1);
        const r = await resolveCustomBlank(line.blank, line.color, line.size);
        for (let u = 0; u < qty; u++) {
            const item = new Item({
                orgId,
                pieceId:    await uniquePieceId(),
                status:     "custom_pending",
                paid:       false,
                custom:     true,
                byob:       !!line.byob,
                order:      order._id,
                poNumber:   data.poNumber,
                name:       r.name || line.blankName || "",
                sku:        customSku(r),
                blank:      r.blank || line.blank || null,
                color:      r.color || null,
                size:       r.size  || null,
                styleCode:  r.code  || line.styleCode || "",
                colorName:  line.color     || "",
                sizeName:   r.sizeName || line.size || "",
                price:      line.unitPrice || 0,
                quantity:   "1",
                type:       line.printType || "",
                design:     line.design && Object.keys(line.design).length ? line.design : undefined,
                dstFile:    dstFileObj || undefined,
                designRef:  null,
                date:       new Date(),
                shipByDate: data.dateNeeded ? new Date(data.dateNeeded) : null,
            });
            await item.save();
            itemIds.push(item._id);
        }
    }

    order.items = itemIds;
    await order.save();

    logActivity({ action: "custom_order_create", entity: "order", entityId: order._id, entityName: data.poNumber || "", userName, email, orgId });
    const populated = await Order.findById(order._id).populate("items").lean();
    return NextResponse.json({ order: populated });
    } catch (err) {
        console.error("[custom-order POST]", err?.message, err);
        return NextResponse.json({ error: err?.message || "Failed to save order" }, { status: 400 });
    }
}
