import { Items, Order, Products, Inventory, ProductInventory } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { updateInventory, recomputeStockStatus } from "@/functions/pullOrders";

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

async function assignInventory(item) {
    const productInventory = await ProductInventory.findOne({ sku: item.sku });
    if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
        item.inventory.inventoryType = "productInventory";
        item.inventory.productInventory = productInventory._id;
        productInventory.inStock.push(item._id.toString());
        await productInventory.save();
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size });
        if (!inventory) {
            inventory = await Inventory.findOne({ inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` });
        }
        if (inventory) {
            if (!item.inventory) item.inventory = {};
            item.inventory.inventoryType = "inventory";
            item.inventory.inventory = inventory._id;
        }
    }
    return item;
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

        const units = await Promise.all(Array.from({ length: unitCount }, () =>
            new Items({
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

        // Assign inventory to each unit, then save
        return Promise.all(units.map(item => assignInventory(item).then(i => i.save())));
    }))).flat();

    const total = savedItems.reduce((sum, it) => sum + (it.price ?? 0), 0);
    order.items = savedItems.map(it => it._id);
    order.total = total;
    await order.save();

    // Run the same inventory + stock status recompute as pullOrders
    await updateInventory();
    await recomputeStockStatus();

    return NextResponse.json({ success: true, orderId: order._id.toString(), poNumber });
}
