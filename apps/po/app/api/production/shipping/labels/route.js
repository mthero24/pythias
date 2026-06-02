import { NextApiRequest, NextResponse } from "next/server";
import { buyLabel } from "@pythias/shipping";
import { getRefund } from "@pythias/shipping";
import Order from "@/models/Order";
import User from "@/models/User";
import manifest from "@/models/manifest";
import axios from "axios";
import Bin from "@/models/Bin";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();

    let order = await Order.findOne({ _id: data.orderId }).populate("items");
    console.log(order.user, "order user");
    let user = await User.findById(order.user);
    console.log(user, "user in shipping route");
    order.user = user;

    if (order.preShipped) {
        const sc = await getShippingCreds();
        const headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
            }
        };
        let res = await axios.post(`http://${sc.localIP}/api/shipping/printers`, { label: order.shippingInfo.label, station: data.station, barcode: "ppp" }, headers);
        console.log(res.data);
        for (let i of order.items) {
            i.shipped = true;
            await i.save();
        }
        await Bin.findOneAndUpdate({ order: order._id }, { "items": [], "ready": false, "inUse": false, "order": null, "giftWrap": false, "readyToWrap": false, "wrapped": false, "wrapImage": null });
        if (res && res.error && res.msg != `{"code":"ECONNRESET"}`) {
            return NextResponse.json({ error: true, msg: "error printing label" });
        } else {
            logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email, provider: "po" });
            return NextResponse.json({
                error: false, label: order.shippingInfo.label,
                bins: {
                    readyToShip: await Bin.find({ ready: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
                    inUse: await Bin.find({ inUse: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
                },
            });
        }
    } else if (order.status == "shipped" && order.shippingInfo.label == undefined) {
        return NextResponse.json({ error: true, msg: "Order Already Shipped reprint label" });
    }

    if (!data.address.country) data.address.country = "US";
    const sc = await getShippingCreds();

    const buyOpts = {
        ...data,
        businessAddress: order.user?.addresses?.[0] ?? sc.businessAddress,
        providers: ["usps", "fedex"],
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsFedExNew: sc.credentialsFedExNew,
        credentialsUPS: sc.credentialsUPS,
        credentialsDHL: sc.credentialsDHL,
        credentialsShipStation: sc.credentialsShipStation,
        carrierCodes: sc.carrierCodes,
        warehouse_id: sc.warehouse_id,
        dpi: data.station == "station5" ? 300 : null,
        imageFormat: data.station == "station5" ? "PDF" : null,
    };

    try {
        const pkgs = data.packages?.length > 1 ? data.packages : [{ weight: data.weight, dimensions: data.dimensions }];
        const purchasedLabels = [];
        for (const pkg of pkgs) {
            const lbl = await buyLabel({ ...buyOpts, weight: pkg.weight, dimensions: pkg.dimensions });
            if (!lbl || lbl.error) return NextResponse.json(lbl ?? { error: true, msg: "No label returned" });
            purchasedLabels.push(lbl);
        }
        const primaryLabel = purchasedLabels[0];
        const totalCost = purchasedLabels.reduce((s, l) => s + parseFloat(l.cost || 0), 0);

        let ord = await Order.findOne({ _id: data.orderId }).populate("items");
        ord.shippingInfo.label = primaryLabel.label;
        ord.shippingInfo.shippingCost += totalCost;
        ord.status = "Shipped";
        for (const lbl of purchasedLabels) {
            if (data.selectedShipping.provider == "usps") {
                await new manifest({ pic: lbl.trackingNumber, Date: new Date() }).save();
            }
            ord.shippingInfo.labels.push({
                trackingNumber: lbl.trackingNumber,
                label: lbl.label,
                cost: parseFloat(lbl.cost || 0),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping.provider,
            });
        }
        for (let item of ord.items) {
            item.shipped = true;
            item.shippedDate = new Date();
            if (!item.steps) item.steps = [];
            item.steps.push({ status: "Shipped", date: new Date() });
            await item.save();
        }
        ord = await ord.save();
        logActivity({ action: "order_shipped", entity: "order", entityId: ord._id, entityName: ord.poNumber || ord.orderId || "", userName, email, provider: "po" });
        await Bin.findOneAndUpdate({ order: ord._id }, { "items": [], "ready": false, "inUse": false, "order": null, "giftWrap": false, "readyToWrap": false, "wrapped": false, "wrapImage": null });
        const printHeaders = { headers: { "Content-Type": "application/json", "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy` } };
        const endpoint = data.station == "station5" ? "cpu" : "printers";
        for (const lbl of purchasedLabels) {
            try {
                const res = await axios.post(`http://${sc.localIP}/api/shipping/${endpoint}`, { label: lbl.label, station: data.station, barcode: "po" }, printHeaders);
                console.log(res.data, "printer res");
            } catch(e) { console.error("Print failed:", e.message); }
        }
        return NextResponse.json({
            error: false,
            label: primaryLabel.label,
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
        credentialsShipStation: sc.credentialsShipStation,
        carrierCodes: sc.carrierCodes,
        warehouse_id: sc.warehouse_id,
    });
    return NextResponse.json(res);
}
