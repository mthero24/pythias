import { PlatformItem as Items, PlatformOrder as Order, PlatformProduct as Products } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function genOrderId() {
    return `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function resolveDesign(designImages, designId) {
    if (designImages) return designImages;
    if (!designId) return null;
    const prod = await Products.findOne({ design: designId })
        .populate("design", "images")
        .select("design").lean();
    return prod?.design?.images ?? null;
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session?.user?.orgId;

    const body = await req.json();
    const { items, marketplace, poNumber, shippingAddress } = body;

    if (!Array.isArray(items) || !items.length) {
        return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }
    if (!poNumber) return NextResponse.json({ error: "poNumber is required" }, { status: 400 });
    if (!shippingAddress?.name || !shippingAddress?.address1 || !shippingAddress?.city || !shippingAddress?.country) {
        return NextResponse.json({ error: "name, address1, city, and country are required" }, { status: 400 });
    }

    const orderId = genOrderId();
    const now = new Date();

    const order = await new Order({
        orgId,
        orderId,
        poNumber,
        status:       "awaiting_shipment",
        shippingType: "Standard",
        marketplace:  marketplace?.trim() || "Manual",
        shippingAddress: {
            name:     shippingAddress.name.trim(),
            phone:    shippingAddress.phone?.trim() ?? "",
            address1: shippingAddress.address1.trim(),
            address2: shippingAddress.address2?.trim() ?? "",
            city:     shippingAddress.city.trim(),
            state:    shippingAddress.state?.trim() ?? "",
            country:  shippingAddress.country.trim(),
            zip:      shippingAddress.zip?.trim() ?? "",
        },
        items: [],
        date:  now,
        new:   true,
        paid:  true,
    }).save();

    const savedItems = (await Promise.all(items.map(async (cartItem) => {
        const {
            sku, colorId, colorName, sizeId, sizeName, blankId, styleCode,
            designId, designImages, printType, price, title, qty,
        } = cartItem;

        const resolvedDesign = await resolveDesign(designImages, designId);
        const unitCount = Math.max(1, Math.min(99, Number(qty) || 1));

        return Promise.all(Array.from({ length: unitCount }, () =>
            new Items({
                orgId,
                pieceId:      generatePieceID(),
                sku,
                blank:        blankId   || null,
                styleCode:    styleCode || "",
                colorName:    colorName || "",
                color:        colorId   || null,
                sizeName:     sizeName  || "",
                size:         sizeId    || null,
                design:       resolvedDesign || {},
                designRef:    designId  || null,
                order:        order._id,
                orderId,
                poNumber,
                shippingType: "Standard",
                quantity:     "1",
                status:       "awaiting_shipment",
                paid:         true,
                isBlank:      false,
                price:        price ?? 0,
                date:         now,
                name:         title || sku,
                type:         printType || null,
            }).save()
        ));
    }))).flat();

    const total = savedItems.reduce((sum, it) => sum + (it.price ?? 0), 0);
    order.items = savedItems.map(it => it._id);
    order.total = total;
    await order.save();

    return NextResponse.json({ success: true, orderId: order._id.toString(), poNumber });
}
