import { NextResponse } from "next/server";
import { PlatformBin, PlatformOrder, PlatformItem, Manifest } from "@pythias/mongo";
import { buyLabel, getRefund } from "@pythias/shipping";
import { updateOrder, createReceiptShipment, shipOrderFaire, shipOrderWalmart, getOrderWalmart } from "@pythias/integrations";
import { getToken } from "next-auth/jwt";
import { getOrgCreds, buildShippingCreds } from "@/lib/getOrgCreds";
import { createCEClient } from "@/functions/channelEngine";
import axios from "axios";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const data = await req.json();
    if (!data.address?.country) data.address.country = "US";

    const creds = await getOrgCreds(orgId);
    const sc = buildShippingCreds(creds);

    try {
        const label = await buyLabel({
            ...data,
            imageType: "PDF",
            imageFormat: "PDF",
            businessAddress: sc.businessAddress,
            providers: ["usps", "ups"],
            enSettings: sc.enSettings,
            credentials: sc.credentials,
            credentialsUPS: sc.credentialsUPS,
            credentialsFedEx: sc.credentialsFedEx,
            credentialsShipStation: { apiKey: sc.ssV2 },
        });

        if (label.error) return NextResponse.json(label);

        if (data.selectedShipping?.provider === "usps") {
            await Manifest.create({ pic: label.trackingNumber, Date: new Date() }).catch(() => {});
        }

        const order = await PlatformOrder.findOne({ orgId, _id: data.orderId }).populate("items");
        if (!order) return NextResponse.json({ error: true, msg: "Order not found" });

        order.shippingInfo = order.shippingInfo ?? {};
        order.shippingInfo.label = label.label;
        order.shippingInfo.shippingCost = (order.shippingInfo.shippingCost ?? 0) + parseFloat(label.cost ?? 0);
        order.shippingInfo.shippedAt = new Date();
        order.shippingInfo.labels = order.shippingInfo.labels ?? [];
        order.shippingInfo.labels.push({
            trackingNumber: label.trackingNumber,
            label: label.label,
            cost: parseFloat(label.cost ?? 0),
            trackingInfo: ["Label Purchased"],
            provider: data.selectedShipping?.provider,
        });
        order.status = "Shipped";

        const itemIds = order.items.map(i => i._id);
        await PlatformItem.updateMany(
            { orgId, _id: { $in: itemIds } },
            { $set: { shipped: true, shippedDate: new Date() }, $push: { steps: { status: "Shipped", date: new Date() } } },
        );
        await order.save();

        // Marketplace tracking updates
        const marketplace = order.marketplace?.toLowerCase();
        if (marketplace === "etsy" && order.marketplaceOrderId && creds.etsy?.accessToken) {
            await createReceiptShipment(
                { type: "etsy", ...creds.etsy },
                order.marketplaceOrderId,
                label.trackingNumber,
                data.selectedShipping?.provider,
            ).catch(e => console.error("Etsy shipment:", e.message));
        }
        if (marketplace === "faire" && order.marketplaceOrderId && creds.faire?.secretId) {
            const FAIRE_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FEDEX", dhl: "DHL_EXPRESS" };
            const carrier = FAIRE_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? "OTHER";
            await shipOrderFaire({
                apiKey: creds.faire.secretId,
                orderId: order.marketplaceOrderId,
                shipments: [{ carrier, tracking_code: label.trackingNumber }],
            }).catch(e => console.error("Faire shipment:", e.message));
        }
        if (marketplace === "walmart" && order.marketplaceOrderId && creds.walmart?.clientId) {
            const WALMART_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
            const carrier = WALMART_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? "USPS";
            try {
                const { order: wOrder } = await getOrderWalmart({
                    clientId: creds.walmart.clientId,
                    clientSecret: creds.walmart.clientSecret,
                    purchaseOrderId: order.marketplaceOrderId,
                });
                if (wOrder) {
                    const lines = (wOrder.orderLines?.orderLine ?? []).map(l => ({
                        lineNumber: l.lineNumber,
                        quantity: parseInt(l.orderLineQuantity?.amount ?? "1", 10),
                        trackingNumber: label.trackingNumber,
                        carrier,
                    }));
                    await shipOrderWalmart({
                        clientId: creds.walmart.clientId,
                        clientSecret: creds.walmart.clientSecret,
                        purchaseOrderId: order.marketplaceOrderId,
                        lines,
                    });
                }
            } catch (e) { console.error("Walmart shipment:", e.message); }
        }
        if (marketplace === "channelengine" && order.marketplaceOrderId && creds.channelengine?.apiUrl) {
            const CE_CARRIER = { usps: "PostNL", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
            const ceCarrier = CE_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? data.selectedShipping?.provider ?? "Other";
            const ceClient = createCEClient(creds.channelengine.apiUrl, creds.channelengine.apiKey);
            const lines = (order.items ?? []).map((item, idx) => ({
                MerchantProductNo: item.sku || item.pieceId || String(idx + 1),
                Quantity: 1,
                ShipmentLineNo: String(idx + 1),
            }));
            await ceClient.createShipment({
                MerchantOrderNo: `CE-${order.marketplaceOrderId}`,
                Lines: lines,
                TrackTraceNo: label.trackingNumber,
                Method: ceCarrier,
                ShippedAt: new Date().toISOString(),
            }).catch(e => console.error("ChannelEngine shipment:", e.message));
        }
        if (marketplace === "shipstation" && creds.shipstation?.apiKey) {
            await updateOrder({
                auth: `${creds.shipstation.apiKey}:${creds.shipstation.apiSecret}`,
                orderId: order.orderId,
                carrierCode: "usps",
                trackingNumber: label.trackingNumber,
            }).catch(e => console.error("ShipStation update:", e.message));
        }

        // Print shipping label on local printer
        await axios.post(
            `http://${creds.localIP}/api/shipping/cpu`,
            { label: label.label, station: data.station, barcode: "ppp" },
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } },
        ).catch(e => console.error("Print request:", e.message));

        // Return updated bin state
        const [readyToShip, inUse] = await Promise.all([
            PlatformBin.find({ orgId, status: "ready" })
                .sort({ number: 1 })
                .populate({ path: "order", populate: "items" })
                .lean(),
            PlatformBin.find({ orgId, status: "in_use" })
                .sort({ number: 1 })
                .populate({ path: "order", populate: "items" })
                .lean(),
        ]);

        return NextResponse.json({
            error: false,
            label: label.label,
            bins: { readyToShip: JSON.parse(JSON.stringify(readyToShip)), inUse: JSON.parse(JSON.stringify(inUse)) },
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: true, msg: e.message ?? JSON.stringify(e) });
    }
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const creds = await getOrgCreds(token.orgId);
    const sc = buildShippingCreds(creds);

    const res = await getRefund({
        providers: ["usps", "fedex"],
        PIC: data.PIC,
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsUPS: sc.credentialsUPS,
    });
    return NextResponse.json(res);
}
