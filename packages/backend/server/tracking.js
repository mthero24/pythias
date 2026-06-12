import { uspsTracking, TrackPackageFedEx, TrackPackageUPS } from "@pythias/shipping";

const SHIPPED_STATUSES = ["shipped", "Shipped", "Out For Delivery", "out_for_delivery"];

// Returns { trackOrder, runTracking, runTrackingAll } bound to the provided Order model and credential getters.
// Each credential getter is a zero-arg function called at request time so env vars are resolved lazily.
export function createTracking({ Order, uspsCredentials, fedexCredentials, upsCredentials, onDelivered }) {

    async function processOrderTracking(order) {
        if (!order.shippingInfo?.labels?.length) return false;
        let changed = false;

        for (const lbl of order.shippingInfo.labels) {
            if (lbl.delivered || lbl.refunded) continue;
            const tn = lbl.trackingNumber;
            if (!tn) { console.log(`  [tracking] label skipped — no tracking number`); continue; }

            let result = { events: [], expectedDelivery: null };
            try {
                if (tn.startsWith("9") || tn.startsWith("420")) {
                    result = await uspsTracking({ tn, credentials: uspsCredentials() });
                } else if (lbl.provider === "fedex" || lbl.provider === "FedEx") {
                    result = await TrackPackageFedEx({ tn, credentials: fedexCredentials() });
                } else if (tn.toUpperCase().startsWith("1Z") || lbl.provider === "ups" || lbl.provider === "UPS") {
                    result = await TrackPackageUPS({ tn, credentials: upsCredentials() });
                } else {
                    console.log(`  [tracking] no carrier match for ${tn} (provider: ${lbl.provider ?? "none"})`);
                }
            } catch (e) {
                if (e.message === "USPS_QUOTA_EXCEEDED") throw e;
                console.log(`  [tracking] exception for ${tn}:`, e.message);
                continue;
            }

            const { events, expectedDelivery } = result;
            console.log(`  [tracking] ${tn} → events: ${events?.length ?? "null"}, first: ${JSON.stringify(events?.[0])}`);
            if (!events?.length) {
                console.log(`  [tracking] no events returned for ${tn}`);
                continue;
            }

            lbl.trackingInfo = events.slice(0, 10).filter(e => typeof e === "string");
            if (expectedDelivery) lbl.expectedDelivery = expectedDelivery;
            const latest = (typeof events[0] === "string" ? events[0] : "").toLowerCase();

            if (latest.startsWith("delivered")) {
                lbl.delivered = true;
            } else if (latest.includes("out for delivery")) {
                order.status = "Out For Delivery";
            }

            changed = true;
        }

        if (changed) {
            if (order.status !== "Delivered" && order.shippingInfo.labels.every(l => l.delivered || l.refunded)) {
                order.status = "Delivered";
                if (onDelivered) { try { onDelivered(order); } catch (e) { console.error("[tracking] onDelivered failed:", e.message); } }
            }
            order.markModified("shippingInfo.labels");
        }

        return changed;
    }

    const trackOrder = async (orderId) => {
        const order = await Order.findById(orderId).select("status shippingInfo poNumber marketplace");
        if (!order) return;
        if (await processOrderTracking(order)) await order.save();
    };

    const runTracking = async () => {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        console.log("runTracking started at", new Date().toISOString(), "cutoff:", cutoff.toISOString());

        const BATCH = 100;
        let skip = 0, updated = 0, total = 0;

        while (true) {
            const orders = await Order.find({
                status: { $in: SHIPPED_STATUSES },
                "shippingInfo.labels.0": { $exists: true },
                date: { $gt: cutoff },
            }).select("status shippingInfo poNumber date marketplace").sort({ date: 1 }).skip(skip).limit(BATCH);

            if (!orders.length) break;
            total += orders.length;
            console.log(`Batch ${skip / BATCH + 1}: ${orders.length} orders (skip ${skip})`);

            let quotaHit = false;
            const toSave = [];
            for (const order of orders) {
                const pending = (order.shippingInfo?.labels ?? []).filter(l => !l.delivered && !l.refunded && l.trackingNumber).length;
                console.log(`${order.date.toISOString()}  ${order.poNumber} — ${pending} pending label(s)`);
                try {
                    if (await processOrderTracking(order)) {
                        toSave.push(order);
                        updated++;
                    } else {
                        console.log(`  no update for ${order.poNumber}`);
                    }
                } catch (e) {
                    if (e.message === "USPS_QUOTA_EXCEEDED") {
                        console.log("USPS quota exceeded — stopping tracking run");
                        quotaHit = true;
                        break;
                    }
                    throw e;
                }
            }

            if (toSave.length) {
                await Promise.all(toSave.map(o => o.save()));
                console.log(`Batch saved ${toSave.length} orders`);
            }

            skip += BATCH;
            if (quotaHit || orders.length < BATCH) break;
        }

        console.log(`runTracking done — ${updated}/${total} updated`);
        return { updated, total };
    };

    const runTrackingAll = async () => {
        console.log("runTrackingAll started at", new Date().toISOString());
        const orders = await Order.find({
            "shippingInfo.labels.0": { $exists: true },
            status: { $nin: ["Delivered", "Cancelled", "cancelled", "cancelled_by_buyer"] },
        }).select("status shippingInfo poNumber marketplace").limit(100);
        console.log(`Found ${orders.length} orders to track.`);
        let updated = 0;
        for (const order of orders) {
            if (await processOrderTracking(order)) {
                await order.save();
                updated++;
            } else {
                console.log(`No update for order ${order._id} (${order.poNumber})`);
            }
            console.log(`Processed order ${order._id} (${order.poNumber}), updated: ${updated}/${orders.length}`);
        }
        return { updated, total: orders.length };
    };

    return { trackOrder, runTracking, runTrackingAll };
}
