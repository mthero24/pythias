import { NextResponse, NextApiRequest } from "next/server";
import Order from "@/models/Order";
import manifest from "@/models/manifest";
import { getRefund } from "@pythias/shipping";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";

const SHIPPED_QUERY = {
    "shippingInfo.labels": {
        $elemMatch: {
            delivered: { $in: [false, undefined] },
            refunded: { $in: [false, undefined] },
        },
    },
    date: { $gt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    status: { $ne: "Delivered" },
};

const uspsCredentials = () => ({
    clientId: process.env.uspsClientId,
    clientSecret: process.env.uspsClientSecret,
    crid: process.env.uspsCRID,
    mid: process.env.uspsMID,
    manifestMID: process.env.manifestMID,
    accountNumber: process.env.accountNumber,
});

const enSettings = () => ({
    requesterID: process.env.endiciaRequesterID,
    accountNumber: process.env.endiciaAccountNUmber,
    passPhrase: process.env.endiciaPassPhrase,
});

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    const tn = data.label?.trackingNumber?.toString();
    const provider = (data.label?.provider ?? "usps").toLowerCase();

    // Attempt carrier refund for USPS labels
    if (provider === "usps" || provider === "endicia") {
        try {
            await getRefund({
                providers: provider === "endicia" ? ["endicia"] : ["usps"],
                PIC: tn,
                enSettings: enSettings(),
                credentials: uspsCredentials(),
            });
        } catch (e) {
            console.error("[refund] carrier refund error:", e.message);
        }
    }

    // Remove tracking number from manifests
    if (tn) {
        await manifest.deleteOne({ pic: tn }).catch(e =>
            console.error("[refund] manifest delete error:", e.message)
        );
    }

    // Mark label as refunded + delivered (removes it from the refund screen)
    const order = await Order.findOne({ _id: data.order._id });
    if (order) {
        order.shippingInfo.labels.forEach(l => {
            if (l.trackingNumber?.toString() === tn) {
                l.refunded = true;
                l.delivered = true;
            }
        });
        order.markModified("shippingInfo.labels");
        await order.save();
        logActivity({ action: "label_refunded", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email });
        logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", action: "label_refunded", before: { refunded: false }, after: { refunded: true, trackingNumber: tn, provider }, userName, email, provider: "premierPrinting" });
    }

    const orders = await Order.find(SHIPPED_QUERY)
        .select("shippingInfo date poNumber status")
        .sort({ date: 1 })
        .limit(400)
        .lean();

    return NextResponse.json({ error: false, orders });
}

export async function PUT(req = NextApiRequest) {
    const data = await req.json();

    if (data.refresh) {
        const orders = await Order.find(SHIPPED_QUERY)
            .select("shippingInfo date poNumber status")
            .sort({ date: 1 })
            .limit(400)
            .lean();
        return NextResponse.json({ error: false, orders });
    }

    // Hide / mark delivered (no carrier refund, no manifest removal)
    const order = await Order.findOne({ _id: data.order._id });
    if (order) {
        const tn = data.label?.trackingNumber?.toString();
        order.shippingInfo.labels.forEach(l => {
            if (l.trackingNumber?.toString() === tn) l.delivered = true;
        });
        order.markModified("shippingInfo.labels");
        await order.save();
    }

    const orders = await Order.find(SHIPPED_QUERY)
        .select("shippingInfo date poNumber status")
        .sort({ date: 1 })
        .limit(400)
        .lean();

    return NextResponse.json({ error: false, orders });
}
