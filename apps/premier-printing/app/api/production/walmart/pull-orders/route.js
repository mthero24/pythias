import { NextResponse } from "next/server";
import { Design, Items as Item, Blank, Color, Order, Products, ApiKeyIntegrations, Converters } from "@pythias/mongo";
import { getOrdersWalmart, acknowledgeOrderWalmart } from "@pythias/integrations";
import { generatePieceID } from "@pythias/integrations";

async function resolveConverters() {
    const [blankDoc, colorDoc, sizeDoc, skuDoc] = await Promise.all([
        Converters.findOne({ type: "blank" }),
        Converters.findOne({ type: "color" }),
        Converters.findOne({ type: "size" }),
        Converters.findOne({ type: "sku" }),
    ]);
    return {
        blankConverter: blankDoc?.converter ?? {},
        colorFixer: colorDoc?.converter ?? {},
        sizeFixer: sizeDoc?.converter ?? {},
        skuFixer: skuDoc?.converter ?? {},
    };
}

async function createItem(i, order) {
    const item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: i.sku,
        blank: i.blank,
        styleCode: i.blank?.code,
        sizeName: i.sizeName,
        colorName: i.colorName,
        color: i.color,
        size: i.size,
        design: i.design?.images,
        designRef: i.design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: String(i.quantity ?? 1),
        status: order.status,
        name: i.productName,
        date: order.date,
        type: i.design?.printType,
        upc: i.upc,
        isBlank: !i.design,
        price: i.price,
    });
    return item.save();
}

async function resolveItem({ sku, blankConverter, colorFixer, sizeFixer, skuFixer }) {
    const resolvedSku = skuFixer[sku] ?? sku;
    if (!resolvedSku.includes("_")) return null;
    const parts = resolvedSku.split("_");
    const blankCode = parts[0].trim();
    const colorSku = parts[1]?.trim();
    const sizeName = parts[2]?.trim();
    const designSku = parts.slice(3).join("_");

    let blank = await Blank.findOne({ code: blankCode }).populate("colors");
    if (!blank) blank = await Blank.findOne({ code: blankConverter[blankCode] ?? blankCode }).populate("colors");
    if (!blank) return null;

    const color = blank.colors.find(c =>
        c.sku === colorSku?.toLowerCase() ||
        c.name?.toLowerCase() === colorSku?.toLowerCase() ||
        c.name?.toLowerCase() === colorFixer[colorSku]?.toLowerCase()
    );
    const size = blank.sizes.find(s =>
        s.name === sizeName || s.name === sizeFixer[sizeName] ||
        s.sku === sizeName || s.sku === sizeFixer[sizeName]
    );
    const design = designSku ? await Design.findOne({ sku: designSku }) : null;

    const product = (blank && color && size)
        ? await Products.findOne({ variantsArray: { $elemMatch: { sku: resolvedSku } } })
            .populate("design variantsArray.blank variantsArray.color blanks colors design")
        : null;

    return { blank, color, size, design, product, resolvedSku };
}

export async function POST(req) {
    const body = await req.json().catch(() => ({}));
    const { connectionId, createdStartDate, acknowledge = true } = body;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ type: "walmart" }).lean();

    if (!connection) {
        return NextResponse.json({ error: "No Walmart connection found" }, { status: 404 });
    }

    const creds = { clientId: connection.apiKey, clientSecret: connection.apiSecret, partnerId: connection.organization };
    const converters = await resolveConverters();

    const since = createdStartDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    let nextCursor = null;
    let allOrders = [];

    do {
        const result = await getOrdersWalmart({ ...creds, createdStartDate: since, nextCursor, limit: 100 });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        allOrders.push(...result.orders);
        nextCursor = result.hasMore ? result.nextCursor : null;
    } while (nextCursor);

    const results = { created: 0, skipped: 0, errors: [] };

    for (const wo of allOrders) {
        const purchaseOrderId = wo.purchaseOrderId;
        const existing = await Order.findOne({ orderId: purchaseOrderId }).lean();
        if (existing) { results.skipped++; continue; }

        const addr = wo.shippingInfo?.postalAddress ?? {};
        try {
            let order = new Order({
                orderId: purchaseOrderId,
                poNumber: purchaseOrderId,
                date: new Date(wo.orderDate),
                status: "awaiting_shipment",
                marketplace: "Walmart",
                paid: true,
                shippingAddress: {
                    name: addr.name ?? "Not provided",
                    address1: addr.addressLine1 ?? "Not provided",
                    address2: addr.addressLine2 ?? "",
                    city: addr.city ?? "Not provided",
                    state: addr.state ?? "",
                    zip: addr.postalCode ?? "",
                    country: addr.country ?? "US",
                },
                shippingType: "Standard",
                total: 0,
            });
            order = await order.save();

            const orderLines = wo.orderLines?.orderLine ?? [];
            const items = [];
            for (const line of orderLines) {
                const sku = line.item?.sku ?? "";
                const qty = parseInt(line.item?.quantity ?? 1);
                const price = line.charges?.charge?.find(c => c.chargeType === "PRODUCT")?.chargeAmount ?? 0;

                const resolved = await resolveItem({ sku, ...converters });
                for (let q = 0; q < qty; q++) {
                    const item = await createItem({
                        sku,
                        blank: resolved?.blank,
                        color: resolved?.color,
                        colorName: resolved?.color?.name,
                        size: resolved?.size,
                        sizeName: resolved?.size?.name,
                        design: resolved?.design,
                        productName: line.item?.productName,
                        quantity: 1,
                        price,
                    }, order);
                    items.push(item._id);
                }
            }

            order.items = items;
            await order.save();
            results.created++;

            if (acknowledge) {
                await acknowledgeOrderWalmart({ ...creds, purchaseOrderId }).catch(() => {});
            }
        } catch (err) {
            results.errors.push({ purchaseOrderId, error: err.message });
        }
    }

    return NextResponse.json({ ...results, total: allOrders.length });
}
