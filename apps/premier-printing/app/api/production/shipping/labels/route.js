import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import { Order, Manifest as manifest } from "@pythias/mongo";
import axios from "axios"
import { Bin } from "@pythias/mongo";
import {updateOrder, createReceiptShipment, shipOrderFaire, shipOrderWalmart, getOrderWalmart} from "@pythias/integrations";
import { createShipment as ceCreateShipment } from "@/functions/channelEngine";
import {ApiKeyIntegrations, Item as Items} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
export async function POST(req= NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    console.log(data)
    //return NextResponse.json({error: true})
    if(!data.address.country) data.address.country = "US"
    try{
        let label = await buyLabel({
            ...data,
            imageType: "PDF",
            businessAddress: data.marketplace == "TCS"? {name: "TSC Distribution Center", businessName: "ATTN: Online Orders", address: "100 Rains Drive", city: "Fanklin", state: "KY", postalCode: "42134", country: "US"}: JSON.parse(process.env.businessAddress),
            providers: ["usps", "ups"],
            enSettings: {
            requesterID: process.env.endiciaRequesterID,
            accountNumber: process.env.endiciaAccountNUmber,
            passPhrase: process.env.endiciaPassPhrase,
            },
            credentials: {
                clientId: process.env.uspsClientId,
                clientSecret: process.env.uspsClientSecret,
                crid: process.env.uspsCRID,
                mid: process.env.uspsMID,
                manifestMID: process.env.manifestMID,
                accountNumber: process.env.accountNumber,
                api: "apis"
            },
            credentialsFedEx: {
                accountNumber: process.env.tpalfedexaccountnumber,
                meterNumber: process.env.tpalfedexmeternumber,
                key: process.env.tpalfedexkey,
                password: process.env.tpalfedexpassword,
            },
            credentialsFedExNew: {
                accountNumber: process.env.AccountFedExTest,
                key: process.env.ApiKeyTestFedEx,
                secret: process.env.SecretKeyFedExTest,
            },
            credentialsUPS: {
                accountNumber: process.env.upsAccountNumber,
                clientID: process.env.upsClientId,
                clientSecret: process.env.upsClientSecret,
            },
            thirdParty: data.marketplace.trim() == "Zulily"? process.env.upsZulily: data.marketplace.trim() == "TSC"? process.env.upsTSC: null,
            credentialsShipStation: {
                apiKey: process.env.ssV2
            },
            imageFormat: "PDF",
            carrierCodes :{
                usps: "se-65258",
                ups: "se-801899"
            },
            warehouse_id: 349794
        });
        if(label.error){
            return NextResponse.json(label)
        }else{
            console.log(data)
            if(data.selectedShipping.provider == "usps"){
                let man = new manifest({pic: label.trackingNumber, Date: new Date(Date.now())})
                await man.save()
            }
            let order = await Order.findOne({_id: data.orderId}).populate("items")
            const beforeStatus = order.status;
            try {
                await updateOrder({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId:order.orderId, carrierCode: "usps", trackingNumber: label.trackingNumber})
            } catch(e) { console.error("ShipStation update failed:", e.message); }
            order.shippingInfo.label = label.label
            order.shippingInfo.shippingCost += parseFloat(label.cost);
            order.shippingInfo.shippedAt = new Date();
            order.status = "Shipped"
            order.shippingInfo.labels.push({
                trackingNumber: label.trackingNumber,
                label: label.label,
                cost: parseFloat(label.cost),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping.provider
            });
            const itemIds = order.items.map(i => i._id);
            await Items.updateMany(
                { _id: { $in: itemIds } },
                { $set: { shipped: true, shippedDate: new Date() }, $push: { steps: { status: "Shipped", date: new Date() } } }
            );
            order = await order.save();
            logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email });
            logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", action: "label_purchased", before: { status: beforeStatus }, after: { status: "Shipped", trackingNumber: label.trackingNumber, carrier: data.selectedShipping.provider, cost: parseFloat(label.cost) }, userName, email, provider: "premierPrinting" });
            if (order.marketplace?.toLowerCase() === "etsy" && order.marketplaceOrderId) {
                try {
                    const etsyConn = await ApiKeyIntegrations.findOne({ type: "etsy" });
                    if (etsyConn) {
                        await createReceiptShipment(etsyConn, order.marketplaceOrderId, label.trackingNumber, data.selectedShipping.provider);
                    }
                } catch (e) { console.error("Failed to update Etsy shipment:", e.message); }
            }
            if (order.marketplace?.toLowerCase() === "faire" && order.marketplaceOrderId) {
                try {
                    const faireConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId)
                        ?? await ApiKeyIntegrations.findOne({ type: "faire" });
                    if (faireConn) {
                        const FAIRE_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FEDEX", dhl: "DHL_EXPRESS" };
                        const carrier = FAIRE_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? "OTHER";
                        await shipOrderFaire({ apiKey: faireConn.apiKey, orderId: order.marketplaceOrderId, shipments: [{ carrier, tracking_code: label.trackingNumber }] });
                    }
                } catch (e) { console.error("Failed to update Faire shipment:", e.message); }
            }
            if (order.marketplace?.toLowerCase() === "walmart" && order.marketplaceOrderId) {
                try {
                    const walmartConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId)
                        ?? await ApiKeyIntegrations.findOne({ type: "walmart" });
                    if (walmartConn) {
                        const WALMART_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                        const carrier = WALMART_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? "USPS";
                        const { order: wOrder } = await getOrderWalmart({ clientId: walmartConn.apiKey, clientSecret: walmartConn.apiSecret, purchaseOrderId: order.marketplaceOrderId });
                        if (wOrder) {
                            const lines = (wOrder.orderLines?.orderLine ?? []).map(l => ({
                                lineNumber: l.lineNumber,
                                quantity: parseInt(l.orderLineQuantity?.amount ?? "1", 10),
                                trackingNumber: label.trackingNumber,
                                carrier,
                            }));
                            await shipOrderWalmart({ clientId: walmartConn.apiKey, clientSecret: walmartConn.apiSecret, purchaseOrderId: order.marketplaceOrderId, lines });
                        }
                    }
                } catch (e) { console.error("Failed to update Walmart shipment:", e.message); }
            }
            if (order.marketplace?.toLowerCase() === "channelengine" && order.marketplaceOrderId) {
                try {
                    const CE_CARRIER = { usps: "PostNL", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                    const ceCarrier = CE_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? data.selectedShipping.provider ?? "Other";
                    const lines = (order.items ?? []).map((item, idx) => ({
                        MerchantProductNo: item.sku || item.pieceId || String(idx + 1),
                        Quantity: 1,
                        ShipmentLineNo: String(idx + 1),
                    }));
                    await ceCreateShipment({
                        MerchantOrderNo: `CE-${order.marketplaceOrderId}`,
                        Lines: lines,
                        TrackTraceNo: label.trackingNumber,
                        Method: ceCarrier,
                        ShippedAt: new Date().toISOString(),
                    });
                } catch (e) { console.error("Failed to update ChannelEngine shipment:", e.message); }
            }
            // print label
            let bin = await Bin.findOneAndUpdate({order: order._id},  {"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null})
            let headers = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
                }
            }
            try {
                let res = await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, {label: label.label, station: data.station, barcode: "ppp"}, headers)
                console.log(res.data)
            } catch(e) { console.error("Print request failed:", e.message); }
            return NextResponse.json({error: false, label: label.label,
                bins: {
                    readyToShip: await Bin.find({ ready: true })
                        .sort({ number: 1 })
                        .populate({ path: "order", populate: "items" })
                        .lean(),
                    inUse: await Bin.find({ inUse: true })
                        .sort({ number: 1 })
                        .populate({ path: "order", populate: "items" })
                        .lean(),
            },})
        }
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg:JSON.stringify(e)})
    }
}

export async function PUT(req= NextApiRequest){
    let data = await req.json();
    let res = await getRefund({providers: ["usps", "fedex"], PIC: data.PIC,  enSettings: {
        requesterID: process.env.endiciaRequesterID,
        accountNumber: process.env.endiciaAccountNUmber,
        passPhrase: process.env.endiciaPassPhrase,
        },
        credentials: {
            clientId: process.env.uspsClientId,
            clientSecret: process.env.uspsClientSecret,
            crid: process.env.uspsCRID,
            mid: process.env.uspsMID,
            manifestMID: process.env.manifestMID,
            accountNumber: process.env.accountNumber
        },
        credentialsFedEx: {
        accountNumber: process.env.tpalfedexaccountnumber,
        meterNumber: process.env.tpalfedexmeternumber,
        key: process.env.tpalfedexkey,
        password: process.env.tpalfedexpassword,
        },
        credentialsFedExNew: {
        accountNumber: process.env.AccountFedExTest,
        key: process.env.ApiKeyTestFedEx,
        secret: process.env.SecretKeyFedExTest,
        },
        credentialsUPS: {
        accountNumber: process.env.UPSAccountNumber,
        clientID: process.env.UPSClientID,
        clientSecret: process.env.UPSClientSecret,
        },})
    return NextResponse.json(res)
}