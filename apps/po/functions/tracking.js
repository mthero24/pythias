import { uspsTracking, TrackPackageFedEx } from "@pythias/shipping";
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

export const trackOrder = async (orderId) => {
    const order = await Order.findById(orderId).select("status shippingInfo poNumber");
    if (!order) return;

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
            }
        } catch (e) {
            console.log("Tracking error for", tn, e.message);
            continue;
        }

        const { events, expectedDelivery } = result;
        if (!events?.length) continue;

        lbl.trackingInfo = events.slice(0, 10);
        if (expectedDelivery) lbl.expectedDelivery = expectedDelivery;
        const latest = events[0]?.toLowerCase() || "";

        if (latest.includes("delivered") && !latest.includes("out for")) {
            lbl.delivered = true;
        } else if (latest.includes("out for delivery")) {
            order.status = "Out For Delivery";
        }
        changed = true;
    }

    if (changed) {
        if (order.shippingInfo.labels.every(l => l.delivered)) order.status = "Delivered";
        order.markModified("shippingInfo.labels");
        await order.save();
    }
};

export const runTracking = async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
        status: { $in: ["Shipped", "shipped", "Out For Delivery"] },
        "shippingInfo.labels.0": { $exists: true },
        date: { $gt: cutoff },
    }).select("status shippingInfo poNumber");

    let updated = 0;

    for (const order of orders) {
        let orderChanged = false;

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
                }
            } catch (e) {
                console.log("Tracking error for", tn, e.message);
                continue;
            }

            const { events, expectedDelivery } = result;
            if (!events?.length) continue;

            lbl.trackingInfo = events.slice(0, 10);
            if (expectedDelivery) lbl.expectedDelivery = expectedDelivery;
            const latest = events[0]?.toLowerCase() || "";

            if (latest.includes("delivered") && !latest.includes("out for")) {
                lbl.delivered = true;
            } else if (latest.includes("out for delivery")) {
                order.status = "Out For Delivery";
            }

            orderChanged = true;
        }

        if (orderChanged) {
            if (order.shippingInfo.labels.length > 0 && order.shippingInfo.labels.every(l => l.delivered)) {
                order.status = "Delivered";
            }
            order.markModified("shippingInfo.labels");
            await order.save();
            updated++;
        }
    }

    return { updated, total: orders.length };
};
