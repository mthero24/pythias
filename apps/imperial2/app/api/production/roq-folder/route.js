import { NextApiRequest, NextResponse } from "next/server";
import {Items, Order, Manifest} from "@pythias/mongo";
import {isSingleItem, isShipped, canceled} from "@/functions/itemFunctions"
import {buyLabel} from "@pythias/shipping"
import axios from "axios";
import {updateOrder} from "@pythias/integrations";
import { truncate } from "fs";
const ups =["faire", "Zulily", "TSC"]
export async function POST(req = NextApiRequest){
    let data = await req.json();
    console.log(data)
    let item = await Items.findOne({pieceId: data.scan,}).populate("blank")
    if(item) item.order = await Order.findOne({_id: item.order}).populate("items")
    console.log(item?.order, "item order",)
    if(item.order.status == "shipped" && item.order.shippingInfo.label == undefined){
        return NextResponse.json({error: true, msg: "Order Already Shipped Check Ship Station for label"})   
    }
    if(item){
        console.log(isSingleItem(item))
        if(canceled(item, item.order) == true) return NextResponse.json({error: true, msg: "Item Canceled"})
        else if(isSingleItem(item) == true && !ups.includes(item.order.marketplace)) {
            //buy label ## address, poNumber, weight, selectedShipping, dimensions, businessAddress, providers, enSettings, credentials,
            // credentialsShipStation, imageFormat, carrierCodes, warehouse_id
            //something
            let send = {
                address: item.order.shippingAddress, 
                poNumber: item.order.poNumber, 
                weight: item.blank.sizes.filter(s=> s.name.toLowerCase() == item.sizeName.toLowerCase())[0].weight?item.blank.sizes.filter(s=> s.name.toLowerCase() == item.sizeName.toLowerCase())[0].weight: 8, 
                selectedShipping: { provider: "usps", name: "USPS_GROUND_ADVANTAGE" }, dimensions: {width: 8, length: 11, height: 1}, 
                businessAddress: JSON.parse(process.env.businessAddress),
                providers: ["usps"],
                credentials: {
                    clientId: process.env.uspsClientId,
                    clientSecret: process.env.uspsClientSecret,
                    crid: process.env.uspsCRID,
                    mid: process.env.uspsMID,
                    manifestMID: process.env.manifestMID,
                    accountNumber: process.env.accountNumber,
                    api: "apis"
                },
                enSettings: {
                    requesterID: process.env.endiciaRequesterID,
                    accountNumber: process.env.endiciaAccountNUmber,
                    passPhrase: process.env.endiciaPassPhrase,
                },
                credentialsShipStation: {
                    apiKey: process.env.ssV2
                },
                imageFormat: "PDF",
                    carrierCodes :{
                    usps: "se-1652813",
                },
                warehouse_id: 62666,
            }
            if(!item.order.preShipped){
                let label = await buyLabel(send)
                if(label.error) return NextResponse.json(label)
                let man = new Manifest({pic: label.trackingNumber, Date: new Date(Date.now())})
                await man.save()
                item.order.preShipped = true
                item.order.shippingInfo.label = label.label
                item.order.shippingInfo.shippingCost += parseFloat(label.cost);
                item.order.status = "Shipped"
                item.order.shippingInfo.labels.push({
                    trackingNumber: label.trackingNumber,
                    label: label.label,
                    cost: parseFloat(label.cost),
                    trackingInfo: ["Label Purchased"],
                });
                item.shipped = true
                item.status = "Shipped"
                item.steps.push({
                    status: `Shipped`,
                    date: new Date(),
                });
                let re2s = updateOrder({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId:item.order.orderId, carrierCode: "usps", trackingNumber: label.trackingNumber})
                await item.order.save();
            }
        }
        //get fold settings
        let foldSettings = await item.blank.fold.filter(f=> f.size.toLowerCase() == item.sizeName.toLowerCase() || f.sizeName?.toLowerCase() == item.sizeName.toLowerCase())[0]
        console.log(foldSettings)
        //send to folder
        if(foldSettings){
            let responseData
            let headers = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
                }
            }
            let response = await axios.post(
                `http://${process.env.localIP}/api/roq-folder`,
                {
                  barcode: item.pieceId,
                  label: item.order.shippingInfo.label,
                  labelType: "pdf",
                  style: item.blank.code,
                  design: item.sku.split("-")[0],
                  size: item.sizeName,
                  color: item.color,
                  quantity: 1,
                  codeFormat: 128,
                  pause: "P",
                  QuantityToStack: 1,
                  Recipe: foldSettings.fold,
                  exit: item.order.preShipped == true ? "Pack" : "Stack",
                  roqNew: true
                }, headers
            ).catch(e=>{responseData = e.response?.data});
            item.folded = true
            item.status = item.order.preShipped ? "Shipped" : "Folded";
            if (!item.steps) item.steps = [];
            item.steps.push({
                status: "Folded",
                date: new Date(),
            });
            await item.save();
            console.log(response?.data, responseData)
            if(response?.data.error) return NextResponse.json(response.data)
            else if(responseData) return NextResponse.json(responseData)
            else return NextResponse.json({error: false, msg: "added to que", item, source: "PP"})
        }
        else return NextResponse.json({error: true, msg: "Could Not Find Fold Settings"})
    }else{
        return NextResponse.json({error: true, msg: "Item not found"})
    }
}