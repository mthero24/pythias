import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import manifest from "../../../../models/manifest";
import {isSingleItem, isShipped, canceled} from "../../../../functions/itemFunctions"
import {buyLabel} from "@pythias/shipping"
import axios from "axios";
export async function POST(req = NextApiRequest){
    let data = await req.json();
    console.log(data)
    let item = await Items.findOne({pieceId: data.scan,}).populate({path: "order", populate: "items"}).populate("styleV2")
    if(item){
        if(canceled(item, item.order) == true) return NextResponse.json({error: true, msg: "Item Canceled"})
        else if(isSingleItem(item) == true && item.order.shippingType == "Standard") {
            //buy label ## address, poNumber, weight, selectedShipping, dimensions, businessAddress, providers, enSettings, credentials,
            let send = {
                address: item.order.shippingAddress, 
                poNumber: item.order.poNumber, 
                weight: item.styleV2.sizes.filter(s=> s.name.toLowerCase() == item.sizeName.toLowerCase())[0].weight, 
                selectedShipping: {provider: "usps", name: "USPS_GROUND_ADVANTAGE"}, dimensions: {width: 8, length: 11, height: 1}, 
                businessAddress: JSON.parse(process.env.businessAddress),
                providers: ["endicia", "fedex"],                
                credentials: {
                    clientId: process.env.uspsClientId,
                    clientSecret: process.env.uspsClientSecret,
                    crid: process.env.uspsCRID,
                    mid: process.env.uspsMID,
                    manifestMID: process.env.manifestMID,
                    accountNumber: process.env.accountNumber
                },
                enSettings: {
                    requesterID: process.env.endiciaRequesterID,
                    accountNumber: process.env.endiciaAccountNUmber,
                    passPhrase: process.env.endiciaPassPhrase,
                },
            }
            if(!item.order.preShipped){
                let label = await buyLabel(send)
                if(label.error) return NextResponse.json(label)
                let man = new manifest({pic: label.trackingNumber, Date: new Date(Date.now())})
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
                await item.order.save();
            }
        }
        //get fold settings
        let foldSettings = await item.styleV2.fold.filter(f=> f.size.toLowerCase() == item.sizeName.toLowerCase() || f.sizeName?.toLowerCase() == item.sizeName.toLowerCase())[0]
        console.log(foldSettings)
        //send to folder
        if(foldSettings){
            let responseData
            let headers = {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
                }
            }
            let response = await axios.post(
                `http://${process.env.localIP}/api/roq-folder`,
                {
                  barcode: item.pieceId,
                  label: item.order.shippingInfo.label,
                  style: item.styleV2.code,
                  design: item.sku.split("-")[0],
                  size: item.sizeName,
                  color: item.color,
                  quantity: 1,
                  codeFormat: 128,
                  pause: "P",
                  QuantityToStack: 8,
                  Recipe: foldSettings.recipe,
                  sleeves: foldSettings.sleeve,
                  body: foldSettings.body,
                  exit: item.order.preShipped == true ? "Pack" : "Stack",
                }, headers
            ).catch(e=>{responseData = e.response?.data});
            item.folded = true
            item.lastScan = {
                station: `ROQ Folded`,
                date: new Date(Date.now()),
            };
            item.status = item.order.preShipped ? "Shipped" : "Folded";
            if (!item.steps) item.steps = [];
            item.steps.push({
            status: item.status,
            date: new Date(),
            });
            await item.save();
            console.log(response?.data, responseData)
            if(response?.data.error) return NextResponse.json(response.data)
            else if(responseData) return NextResponse.json(responseData)
            else return NextResponse.json({error: false, msg: "added to que", item})
        }
        else return NextResponse.json({error: true, msg: "Could Not Find Fold Settings"})
    }else{
        return NextResponse.json({error: true, msg: "Item not found"})
    }
}