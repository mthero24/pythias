// Shared response shapers for the Partner API.
// These produce the clean, stable JSON shapes returned by GET endpoints AND
// sent as webhook payloads, so a partner store can upsert from either source.

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const looksLikeObjectId = (v) => typeof v === "string" && OBJECT_ID_RE.test(v);

// product: a lean PlatformProduct with `variantsArray.color` and `blanks` populated.
export function shapeProduct(product) {
    if (!product) return null;

    // Map size id -> name from any populated blanks (catalog products store size as an id)
    const sizeNameById = {};
    for (const b of product.blanks ?? []) {
        for (const s of b.sizes ?? []) {
            if (s?._id) sizeNameById[s._id.toString()] = s.name;
        }
    }

    // Deduped product images
    const images = [];
    for (const pi of product.productImages ?? []) {
        if (pi?.image && !images.includes(pi.image)) images.push(pi.image);
    }

    const variants = (product.variantsArray ?? []).map((v) => ({
        sku:   v.sku ?? null,
        price: v.price ?? null,
        // color ref populated -> name; pushed products keep the name in ids.colorName
        color: v.color?.name ?? v.ids?.colorName ?? null,
        // catalog: size is an id into blank.sizes; pushed: size is the name string
        size:  sizeNameById[v.size] ?? v.ids?.sizeName ?? (looksLikeObjectId(v.size) ? null : v.size) ?? null,
        image: v.image ?? null,
        upc:   v.upc ?? null,
    }));

    return {
        id:          product._id?.toString() ?? null,
        title:       product.title ?? null,
        sku:         product.sku ?? null,
        brand:       product.brand ?? null,
        description: product.description ?? null,
        images,
        variants,
        lastUpdated: product.lastUpdated ?? product.createdAt ?? null,
    };
}

// design: a lean PlatformDesign
export function shapeDesign(design) {
    if (!design) return null;
    return {
        id:            design._id?.toString() ?? null,
        sku:           design.sku ?? null,
        name:          design.name ?? null,
        description:   design.description ?? null,
        printType:     design.printType ?? null,
        tags:          design.tags ?? [],
        images:        design.images ?? null,
        embroideryFiles: design.embroideryFiles ?? null,
        published:     design.published ?? false,
    };
}

// item: a lean PlatformItem
export function shapeOrderItem(item) {
    if (!item) return null;
    return {
        sku:          item.sku ?? null,
        name:         item.name ?? null,
        colorName:    item.colorName ?? null,
        sizeName:     item.sizeName ?? null,
        styleCode:    item.styleCode ?? null,
        quantity:     item.quantity ?? "1",
        status:       item.status ?? null,
        price:        item.price ?? 0,
        discount:     item.discount ?? 0,
        discountName: item.discountName ?? null,
    };
}

// order: a lean PlatformOrder, optionally with `items` populated
export function shapeOrder(order) {
    if (!order) return null;
    const itemsPopulated = Array.isArray(order.items) && order.items.some((i) => i && typeof i === "object" && i.sku !== undefined);
    return {
        id:             order._id?.toString() ?? null,
        orderId:        order.orderId ?? null,
        poNumber:       order.poNumber ?? null,
        status:         order.status ?? null,
        marketplace:    order.marketplace ?? null,
        customerEmail:  order.customerEmail ?? null,
        total:          order.total ?? 0,
        productCost:    order.productCost ?? 0,
        shippingCost:   order.shippingCost ?? 0,
        discountAmount: order.discountAmount ?? 0,
        discountName:   order.discountName ?? null,
        shippingAddress: order.shippingAddress ?? null,
        date:           order.date ?? null,
        shipByDate:     order.shipByDate ?? null,
        ...(itemsPopulated ? { items: order.items.map(shapeOrderItem) } : {}),
    };
}
