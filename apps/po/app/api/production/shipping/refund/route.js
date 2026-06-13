import { NextResponse, NextApiRequest } from "next/server";
import Order from "@/models/Order"
import Manifest from "@/models/manifest";
import {getRefund} from "@pythias/shipping"

export async function POST(req= NextApiRequest){
    let data = await req.json()
    const tn = data.label?.trackingNumber?.toString();

    await getRefund({providers: ["usps", "fedex"], PIC: tn, enSettings: {
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

    // Remove tracking number from manifest
    if (tn) {
        await Manifest.deleteOne({ pic: tn }).catch(e =>
            console.error("[refund] manifest delete error:", e.message)
        );
    }

    let order = await Order.findOne({_id: data.order._id})
    if(order){
        order.shippingInfo.labels.forEach(l => {
            if(l.trackingNumber?.toString() === tn) {
                l.refunded = true;
                l.delivered = true;
            }
        })
        order.markModified("shippingInfo.labels")
        await order.save()
    }
    let orders = await Order.find({"shippingInfo.labels.delivered": {$in: [false]}, date: {$gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000))}, "selectedShipping.provider": "usps", status: {$ne: "Delivered"}}).sort({date: 1}).select("shippingInfo date poNumber status").limit(400).lean()
    return NextResponse.json({error: false, orders})
}

export async function PUT(req= NextApiRequest){
    let data = await req.json()
    if (data.refresh) {
        let orders = await Order.find({"shippingInfo.labels.delivered": {$in: [false]}, date: {$gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000))}, status: {$ne: "Delivered"}}).sort({date: 1}).select("shippingInfo date poNumber status").limit(400).lean()
        return NextResponse.json({error: false, orders})
    }
    console.log(data.order._id)
    let order = await Order.findOne({_id: data.order._id})
    console.log(order.shippingInfo.labels.length)
    if(order){
        order.shippingInfo.labels.map(l=> {
            console.log(l.trackingNumber.toString() == data.label.trackingNumber.toString(), l.trackingNumber, data.label.trackingNumber)
            if(l.trackingNumber.toString() == data.label.trackingNumber.toString()) l.delivered = true
            return l
        })
        order.markModified("shippingInfo.labels")
        await order.save()
    }
    let orders = await Order.find({ "shippingInfo.labels.delivered": { $in: [false] }, date: { $gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000)) }, "selectedShipping.provider": "usps", status: { $ne: "Delivered" } }).sort({ date: 1 }).select("shippingInfo date poNumber status").limit(50)
    return NextResponse.json({error: false, orders})
}