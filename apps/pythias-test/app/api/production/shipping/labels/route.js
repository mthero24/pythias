import { NextApiRequest, NextResponse } from "next/server";
import { buyLabel } from "@pythias/shipping";
import { getRefund } from "@pythias/shipping";
import { Order } from "@pythias/mongo";
import { Manifest as manifest } from "@pythias/mongo";
import axios from "axios";
import { Bin } from "@pythias/mongo";
import { updateOrder } from "@pythias/integrations";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    console.log(data);
    if (!data.address.country) data.address.country = "US";
    const sc = await getShippingCreds();
    const stationCfg = sc.stations.find(s => s.name === data.station);
    const stationFormat = stationCfg?.format ?? "PDF";
    const printEndpoint = stationFormat === "ZPL" ? "printers" : "cpu";
    const buyOpts = {
        ...data,
        imageType: stationFormat,
        businessAddress: data.marketplace == "TCS" ? { name: "TSC Distribution Center", businessName: "ATTN: Online Orders", address: "100 Rains Drive", city: "Fanklin", state: "KY", postalCode: "42134", country: "US" } : sc.businessAddress,
        providers: ["usps", "ups"],
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsFedExNew: sc.credentialsFedExNew,
        credentialsUPS: sc.credentialsUPS,
        credentialsDHL: sc.credentialsDHL,
        thirdParty: data.marketplace?.trim() == "Zulily" ? process.env.upsZulily : data.marketplace?.trim() == "TSC" ? process.env.upsTSC : null,
        credentialsShipStation: sc.credentialsShipStation,
        imageFormat: stationFormat,
        carrierCodes: sc.carrierCodes,
        warehouse_id: sc.warehouse_id,
    };
    try {
        const pkgs = data.packages?.length > 1 ? data.packages : [{ weight: data.weight, dimensions: data.dimensions }];
        const purchasedLabels = [];
        for (const pkg of pkgs) {
            const lbl = await buyLabel({ ...buyOpts, weight: pkg.weight, dimensions: pkg.dimensions });
            if (lbl.error) return NextResponse.json(lbl);
            purchasedLabels.push(lbl);
        }
        const primaryLabel = purchasedLabels[0];
        const totalCost = purchasedLabels.reduce((s, l) => s + parseFloat(l.cost || 0), 0);

        let order = await Order.findOne({ _id: data.orderId }).populate("items");
        try { await updateOrder({ auth: sc.shipstationAuth, orderId: order.orderId, carrierCode: "usps", trackingNumber: primaryLabel.trackingNumber }); } catch(e) {}
        order.shippingInfo.label = primaryLabel.label;
        order.shippingInfo.shippingCost += totalCost;
        order.status = "Shipped";
        for (const lbl of purchasedLabels) {
            if (data.selectedShipping.provider == "usps") await new manifest({ pic: lbl.trackingNumber, Date: new Date() }).save();
            order.shippingInfo.labels.push({ trackingNumber: lbl.trackingNumber, label: lbl.label, cost: parseFloat(lbl.cost || 0), trackingInfo: ["Label Purchased"], provider: data.selectedShipping.provider, format: stationFormat });
        }
        for (let item of order.items) {
            item.shipped = true; item.shippedDate = new Date();
            if (!item.steps) item.steps = [];
            item.steps.push({ status: "Shipped", date: new Date() });
            await item.save();
        }
        order = await order.save();
        logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email, provider: "pythiasTest" });
        await Bin.findOneAndUpdate({ order: order._id }, { "items": [], "ready": false, "inUse": false, "order": null, "giftWrap": false, "readyToWrap": false, "wrapped": false, "wrapImage": null });
        const printHeaders = { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sc.localKey}` } };
        for (const lbl of purchasedLabels) {
            try { await axios.post(`http://${sc.localIP}/api/shipping/${printEndpoint}`, { label: lbl.label, station: data.station, barcode: "ppp" }, printHeaders); } catch(e) { console.error("Print failed:", e.message); }
        }
        return NextResponse.json({
            error: false, label: primaryLabel.label,
            bins: {
                readyToShip: await Bin.find({ ready: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
                inUse: await Bin.find({ inUse: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
            },
        });
    } catch(e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: JSON.stringify(e) });
    }
}

export async function PUT(req = NextApiRequest) {
    const sc = await getShippingCreds();
    let data = await req.json();
    let res = await getRefund({
        providers: ["usps", "fedex"],
        PIC: data.PIC,
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsFedExNew: sc.credentialsFedExNew,
        credentialsUPS: sc.credentialsUPS,
    });
    return NextResponse.json(res);
}
