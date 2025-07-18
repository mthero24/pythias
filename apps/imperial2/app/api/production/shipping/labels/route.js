import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import {Order, Manifest} from "@pythias/mongo";
import axios from "axios"
import {Bins as Bin} from "@pythias/mongo";
import {updateOrder} from "@pythias/integrations";
export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    //return NextResponse.json({error: true})
    let order = await Order.findOne({_id: data.orderId}).populate("items")
    if(order.preShipped){
        let headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
            }
        }
        let res = await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, {label: order.shippingInfo.label, station: data.station, barcode: "ppp"}, headers)
        console.log(res.data)
        for(let i of order.items){
            i.shipped = true
            await i.save()
        }
        let bin = await Bin.findOneAndUpdate({order: order._id},  {"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null})
        if(res.error){
            return NextResponse.json({error: true, msg: "error printing label"})
        }else{
            console.log("retrun")
            return NextResponse.json({error: false, label: order.shippingInfo.label, 
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
    else if(order.status == "shipped" && order.shippingInfo.label == undefined){
        return NextResponse.json({error: true, msg: "Order Already Shipped Check Ship Station for label"})
    }
    if(!data.address.country) data.address.country = "US"
    try{
        let label = await buyLabel({
            ...data,
            imageType: "PDF",
            businessAddress: JSON.parse(process.env.businessAddress),
            providers: ["usps"],
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
                usps: "se-1652813",
            },
            warehouse_id: 62666,
        });
        if(label.error){
            return NextResponse.json(label)
        }else{
            console.log(data)
            if(data.selectedShipping.provider == "usps"){
                let man = new Manifest({pic: label.trackingNumber, Date: new Date(Date.now())})
                await man.save()
            }
            let order = await Order.findOne({_id: data.orderId}).populate("items")
            let re2s = await updateOrder({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId:order.orderId, carrierCode: "usps", trackingNumber: label.trackingNumber})
            //console.log(re2s)
            order.shippingInfo.label = label.label
            order.shippingInfo.shippingCost += parseFloat(label.cost);
            order.status = "Shipped"
            order.shippingInfo.labels.push({
                trackingNumber: label.trackingNumber,
                label: label.label,
                cost: parseFloat(label.cost),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping.provider
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
                    "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
                }
            }
            let res = await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, {label: label.label, station: data.station, barcode: "ppp"}, headers)
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