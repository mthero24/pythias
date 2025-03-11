import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import Order from "../../../../../models/Order";
import manifest from "../../../../../models/manifest";
import axios from "axios"
import Bin from "../../../../../models/Bin";
export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    //return NextResponse.json({error: true})
    if(!data.address.country) data.address.country = "US"

    try{
        let label = await buyLabel({
            ...data,
            businessAddress: JSON.parse(process.env.businessAddress),
            providers: ["usps", "fedex"],
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
            },
        });
        if(label.error){
            return NextResponse.json(label)
        }else{
            if(data.selectedShipping.provider == "usps"){
                let man = new manifest({pic: label.trackingNumber, Date: new Date(Date.now())})
                await man.save()
            }
            let order = await Order.findOne({_id: data.orderId}).populate("items")
            order.shippingInfo.label = label.label
            order.shippingInfo.shippingCost += parseFloat(label.cost);
            order.status = "Shipped"
            order.shippingInfo.labels.push({
                trackingNumber: label.trackingNumber,
                label: label.label,
                cost: parseFloat(label.cost),
                trackingInfo: ["Label Purchased"],
            });
            for (let item of order.items) {
                item.shipped = true;
                item.shippedDate = new Date();
                if (!item.steps) item.steps = [];
                item.steps.push({
                    status: "Shipped",
                    date: new Date(),
                });
                await item.save();
            }
            order = await order.save();
            // print label
            let bin = await Bin.findOneAndUpdate({order: order._id},  {"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null})
            let headers = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
                }
            }
            let res = await axios.post(`http://${process.env.localIP}/api/shipping/printers`, {label: label.label, station: data.station}, headers)
            console.log(res.data)
            if(res.error){
                return NextResponse.json({error: true, msg: "error printing label"})
            }else{
                console.log("retrun")
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