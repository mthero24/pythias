import { Item, Inventory } from "@pythias/mongo";
import { updateInventory, recomputeStockStatus } from "@/functions/pullOrders";

// Mark a paid custom-order invoice as paid + awaiting_shipment, slot its items into
// inventory, and kick a stock recompute. Shared by the customer /pay/verify path and
// the Stripe webhook backstop. Idempotent (no-op if already paid).
export async function completeInvoiceOrder(order) {
    if (order.paid) return order;
    order.paid   = true;
    order.status = "awaiting_shipment";
    await order.save();
    await Item.updateMany({ order: order._id }, { $set: { paid: true, status: "awaiting_shipment" } });

    const items = await Item.find({ order: order._id });
    for (const item of items) {
        if (item.inventory?.inventory) continue;
        const inv = await Inventory.findOne({ color_name: item.colorName, size_name: item.sizeName, style_code: item.styleCode });
        if (inv) { item.inventory = { inventoryType: "inventory", inventory: inv._id }; await item.save(); }
    }
    updateInventory().then(() => recomputeStockStatus()).catch(err => console.error("[invoice complete recompute]", err));
    return order;
}
