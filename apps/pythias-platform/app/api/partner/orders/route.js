import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformOrder as Order, PlatformItem as Items } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";
import { routeOrder } from "@/functions/routeOrder";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import { resolveLineBySku, resolveBlankByCode } from "@/lib/partnerCatalog";
import { shapeOrder } from "@/lib/partnerShape";
import { recordApiNotification } from "@/lib/recordApiNotification";

function genOrderId() {
    return `PARTNER-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// GET /api/partner/orders?status=awaiting_shipment&page=1&pageSize=50
// List the orders this org has sent us.
export async function GET(req) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status")?.trim();
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10) || 50));

    const filter = { orgId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .select("orderId poNumber status marketplace customerEmail total productCost shippingCost discountAmount discountName shippingAddress date shipByDate")
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Order.countDocuments(filter),
    ]);

    return NextResponse.json({
        orders: orders.map(shapeOrder),
        total,
        page,
        pages: Math.ceil(total / pageSize),
    });
}

// POST /api/partner/orders
// Create an order in the fulfillment pipeline from the partner's storefront.
// Body:
// { poNumber, customerEmail?, shippingCost?, discountAmount?, discountName?,
//   shippingAddress:{ name, address1, city, country, state?, zip?, phone?, address2? },
//   items:[ <catalog line> | <custom line> ] }
//   catalog line: { sku, quantity, price?, discount?, discountName? }  // matched against your catalog
//   custom line:  { quantity, design:{...artwork by side}, styleCode?, colorName?, sizeName?,
//                   printType?, name?, sku?, price?, discount? }        // product need NOT exist;
//                   blank/garment resolved from styleCode, design artwork shipped inline
export async function POST(req) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { poNumber, customerEmail, shippingAddress, items } = body;
    const shippingCost   = Number(body.shippingCost ?? 0) || 0;
    const discountAmount = Number(body.discountAmount ?? 0) || 0;
    const discountName   = body.discountName ?? null;

    // Validate
    if (!poNumber?.toString().trim()) return NextResponse.json({ error: "poNumber is required" }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array is required" }, { status: 400 });
    if (!shippingAddress?.name || !shippingAddress?.address1 || !shippingAddress?.city || !shippingAddress?.country) {
        return NextResponse.json({ error: "shippingAddress.name, address1, city, and country are required" }, { status: 400 });
    }
    // A line is "custom" when it ships its own design artwork — then the product
    // need not exist in our catalog (we still resolve the blank/garment by styleCode).
    const inlineDesign = (l) => {
        const d = l.design ?? l.designImages;
        return d && (typeof d === "object" ? Object.keys(d).length > 0 : !!d);
    };
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it?.sku?.toString().trim() && !inlineDesign(it)) {
            return NextResponse.json({ error: `items[${i}]: provide a sku, or a design with the artwork to print` }, { status: 400 });
        }
        if (!(Number(it.quantity) >= 1)) return NextResponse.json({ error: `items[${i}]: quantity must be >= 1` }, { status: 400 });
    }

    // Resolve every line. Custom (inline-design) lines resolve the blank by styleCode;
    // SKU lines resolve against the catalog. If any SKU line fails, write nothing.
    const resolved = await Promise.all(items.map(async (it) => {
        const sku = it.sku?.toString().trim() || null;
        if (inlineDesign(it)) {
            const b = await resolveBlankByCode(orgId, it.styleCode ?? it.blankCode, it.colorName, it.sizeName);
            const comp = {
                blank:     b?.blank ?? null,
                color:     b?.color ?? null,
                colorName: b?.colorName ?? it.colorName ?? "",
                size:      b?.size ?? null,
                sizeName:  b?.sizeName ?? it.sizeName ?? "",
                styleCode: b?.styleCode ?? it.styleCode ?? it.blankCode ?? "",
                designRef: null,
                design:    it.design ?? it.designImages ?? {},
                name:      it.name ?? sku ?? "Custom item",
                price:     null,
                custom:    true,
                printType: it.printType ?? null,
            };
            return { line: it, sku: sku ?? (comp.styleCode ? `${comp.styleCode}-CUSTOM` : "CUSTOM"), comp };
        }
        return { line: it, sku, comp: sku ? await resolveLineBySku(orgId, sku) : null };
    }));
    const unresolvedSkus = resolved.filter((r) => !r.comp).map((r) => r.sku);
    if (unresolvedSkus.length) {
        recordApiNotification(orgId, {
            level: "error", source: "order.create",
            title: `Order ${poNumber} rejected — unmatched SKUs`,
            message: `These SKUs are not in your catalog: ${unresolvedSkus.join(", ")}. Push the products first, then resend the order.`,
            detail: { poNumber: poNumber.toString().trim(), unresolvedSkus, statusCode: 400 },
        });
        return NextResponse.json({ error: "One or more SKUs could not be matched to your catalog", unresolvedSkus }, { status: 400 });
    }

    const orderId = genOrderId();
    const now = new Date();

    try {
    const order = await new Order({
        orgId,
        orderId,
        poNumber:     poNumber.toString().trim(),
        status:       "awaiting_shipment",
        shippingType: "Standard",
        marketplace:  "Partner API",
        customerEmail: customerEmail?.toString().trim() || undefined,
        shippingCost,
        discountAmount,
        discountName:  discountName || undefined,
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

    // Expand each line's quantity into individual items (quantity "1" each).
    const savedItems = (await Promise.all(resolved.map(async ({ line, sku, comp }) => {
        const unitCount = Math.max(1, Math.min(99, Number(line.quantity) || 1));
        const price     = line.price != null ? Number(line.price) : (comp.price ?? 0);

        return Promise.all(Array.from({ length: unitCount }, () =>
            new Items({
                orgId,
                pieceId:      generatePieceID(),
                sku,
                blank:        comp.blank     || null,
                styleCode:    comp.styleCode || "",
                colorName:    comp.colorName || "",
                color:        comp.color     || null,
                sizeName:     comp.sizeName  || "",
                size:         comp.size      || null,
                design:       comp.design    || {},
                designRef:    comp.designRef || null,
                order:        order._id,
                orderId,
                poNumber:     order.poNumber,
                shippingType: "Standard",
                quantity:     "1",
                status:       "awaiting_shipment",
                paid:         true,
                isBlank:      false,
                custom:       comp.custom || false,
                type:         comp.printType || null,
                price,
                discount:     line.discount != null ? Number(line.discount) : 0,
                discountName: line.discountName ?? undefined,
                date:         now,
                name:         comp.name || sku,
            }).save()
        ));
    }))).flat();

    const productCost = savedItems.reduce((sum, it) => sum + (it.price ?? 0), 0);
    order.items       = savedItems.map((it) => it._id);
    order.productCost = productCost;
    order.total       = productCost + shippingCost - discountAmount;
    await order.save();

    // Commerce Cloud orgs: route to a fulfillment provider immediately.
    if (auth.org.orgType === "commerce") {
        const result = await routeOrder(order, savedItems, auth.org);
        if (result?.unroutable) {
            // routeOrder records the seller-facing alert itself (centralized).
            console.error(`[partner/orders] Order ${order._id} unroutable:`, result.reason);
        }
    }

    // Notify the partner's store (fire-and-forget).
    dispatchWebhook(auth.org, "order.received", shapeOrder({ ...order.toObject(), items: savedItems }))
        .catch(() => {});

    return NextResponse.json({ success: true, orderId: order._id.toString(), poNumber: order.poNumber }, { status: 201 });
    } catch (err) {
        console.error("[partner/orders] create failed:", err);
        recordApiNotification(orgId, {
            level: "error", source: "order.create",
            title: `Order ${poNumber} failed to process`,
            message: err.message,
            detail: { poNumber: poNumber?.toString?.().trim?.(), orderId, statusCode: 500 },
        });
        return NextResponse.json({ error: "Order could not be processed. See the API dashboard for details." }, { status: 500 });
    }
}
