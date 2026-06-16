import { recordApiNotification } from "@/lib/recordApiNotification";

// Non-POD fulfillment handlers for the multi-vertical cart. These are the extension points the
// Dropship Cloud and Warehouse Cloud plug into — today they record the routing decision + alert
// the seller; when those clouds ship, they take over the actual supplier/warehouse dispatch.
// Each returns a fulfillment-group record stored on the order.

export async function routeDropship(order, items, org) {
    // Group dropship lines by supplier so each supplier gets one fulfillment.
    const bySupplier = {};
    for (const it of items) {
        const s = it.dropshipSupplierEmail || "unassigned";
        (bySupplier[s] ||= []).push(it);
    }
    const suppliers = Object.keys(bySupplier);
    await recordApiNotification(org?._id, {
        level: suppliers.includes("unassigned") ? "warning" : "info",
        source: "order.route",
        title: `Order ${order?.poNumber ?? ""} has ${items.length} dropship item(s)`,
        message: suppliers.includes("unassigned")
            ? "Some dropship items have no supplier set — assign a supplier on the product to auto-forward."
            : `Routed to supplier(s): ${suppliers.join(", ")}.`,
        detail: { orderId: order?._id?.toString(), poNumber: order?.poNumber, vertical: "dropship", suppliers },
    });
    return { vertical: "dropship", handler: "supplier", status: "pending_supplier", itemCount: items.length, ref: suppliers.filter((s) => s !== "unassigned").join(",") };
}

export async function routeWarehouse(order, items, org) {
    const skus = [...new Set(items.map((it) => it.warehouseSku).filter(Boolean))];
    await recordApiNotification(org?._id, {
        level: "info",
        source: "order.route",
        title: `Order ${order?.poNumber ?? ""} has ${items.length} warehouse item(s)`,
        message: `Queued for pick/pack from Pythias warehouse stock${skus.length ? ` (SKUs: ${skus.join(", ")})` : ""}.`,
        detail: { orderId: order?._id?.toString(), poNumber: order?.poNumber, vertical: "warehouse", skus },
    });
    return { vertical: "warehouse", handler: "warehouse", status: "pending_warehouse", itemCount: items.length, ref: skus.join(",") };
}
