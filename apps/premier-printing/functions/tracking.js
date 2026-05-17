import { uspsTracking, TrackPackageFedEx, TrackPackageUPS } from "@pythias/shipping";
import Order from "@/models/Order";

const uspsCredentials = () => ({
    clientId: process.env.uspsClientId,
    clientSecret: process.env.uspsClientSecret,
    crid: process.env.uspsCRID,
    mid: process.env.uspsMID,
    manifestMID: process.env.manifestMID,
    accountNumber: process.env.accountNumber,
    api: "apis",
});

const fedexCredentials = () => ({
    accountNumber: process.env.AccountFedExTest,
    key: process.env.ApiKeyTestFedEx,
    secret: process.env.SecretKeyFedExTest,
});

const upsCredentials = () => ({
    clientID: process.env.upsClientId,
    clientSecret: process.env.upsClientSecret,
});

const SHIPPED_STATUSES = ["shipped", "Shipped", "Out For Delivery", "out_for_delivery"];

async function processOrderTracking(order) {
    if (!order.shippingInfo?.labels?.length) return false;
    let changed = false;

    for (const lbl of order.shippingInfo.labels) {
        if (lbl.delivered) continue;
        const tn = lbl.trackingNumber;
        if (!tn) continue;

        let result = { events: [], expectedDelivery: null };
        try {
            if (tn.startsWith("9") || tn.startsWith("420")) {
                result = await uspsTracking({ tn, credentials: uspsCredentials() });
            } else if (lbl.provider === "fedex" || lbl.provider === "FedEx") {
                result = await TrackPackageFedEx({ tn, credentials: fedexCredentials() });
            } else if (tn.toUpperCase().startsWith("1Z") || lbl.provider === "ups" || lbl.provider === "UPS") {
                result = await TrackPackageUPS({ tn, credentials: upsCredentials() });
            }
        } catch (e) {
            console.log("Tracking error for", tn, e.message);
            continue;
        }

        const { events, expectedDelivery } = result;
        if (!events?.length) continue;

        // Normalize — discard any previously stored raw objects, keep only strings
        lbl.trackingInfo = events.slice(0, 10).filter(e => typeof e === "string");
        if (expectedDelivery) lbl.expectedDelivery = expectedDelivery;
        const latest = (typeof events[0] === "string" ? events[0] : "").toLowerCase();

        if (latest.includes("delivered") && !latest.includes("out for")) {
            lbl.delivered = true;
        } else if (latest.includes("out for delivery")) {
            order.status = "Out For Delivery";
        }

        changed = true;
    }

    if (changed) {
        if (order.shippingInfo.labels.every(l => l.delivered)) {
            order.status = "Delivered";
        }
        order.markModified("shippingInfo.labels");
        await order.save();
    }

    return changed;
}

export const trackOrder = async (orderId) => {
    const order = await Order.findById(orderId).select("status shippingInfo poNumber");
    if (!order) return;
    await processOrderTracking(order);
};

export const runTracking = async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
        status: { $in: SHIPPED_STATUSES },
        "shippingInfo.labels.0": { $exists: true },
        date: { $gt: cutoff },
    }).select("status shippingInfo poNumber");

    let updated = 0;
    for (const order of orders) {
        if (await processOrderTracking(order)) updated++;
    }

    return { updated, total: orders.length };
};

export const runTrackingAll = async () => {
    const orders = await Order.find({
        "shippingInfo.labels.0": { $exists: true },
        status: { $nin: ["Delivered", "Cancelled", "cancelled", "cancelled_by_buyer"] },
    }).select("status shippingInfo poNumber");

    let updated = 0;
    for (const order of orders) {
        if (await processOrderTracking(order)) updated++;
    }

    return { updated, total: orders.length };
};
