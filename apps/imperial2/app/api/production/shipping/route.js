import { NextApiRequest, NextResponse } from "next/server";
import {Bin as Bins, Blank, Order, Items, Manifest} from "@pythias/mongo";
import {updateOrder} from "@pythias/integrations";
import axios from "axios";
import {buyLabel} from "@pythias/shipping";
import {isSingleItem, isShipped, canceled} from "@/functions/itemFunctions"
export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)

    if(data.preShip){
        let item = await Items.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
        let order
        if(item){
            order = item.order
        }else{
            order = await Order.findOne({poNumber: data.scan.trim()}).populate("items")
            item = order.items[0]
            item.order = order
        }
        let weight = 0
        for(let i of order.items){
            let blank = await Blank.findOne({_id: i.blank})
            let size = blank.sizes.filter(s=> s.name == item.sizeName)[0]
            weight = size.weight && size.weight > 0? size.weight: 3
        }
        let send = {
            address: item.order.shippingAddress, 
            poNumber: item.order.poNumber, 
            weight: weight? weight: 3, 
            selectedShipping: {provider: "usps", name: "USPS_GROUND_ADVANTAGE"}, dimensions: {width: 8, length: 11, height: 1}, 
            businessAddress: JSON.parse(process.env.businessAddress),
            providers: ["usps",],                
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
            console.log("pre shipping", item.order.poNumber)
            let label = await buyLabel(send)
            console.log(label)
            if(label.error) return NextResponse.json({...label.data})
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
            for(let i of item.order.items){
                i.status = "PreShipped"
                i.steps.push({
                    status: `PreShipped`,
                    date: new Date(),
                });
                await i.save()
            }
            let re2s = updateOrder({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId:item.order.orderId, carrierCode: "usps", trackingNumber: label.trackingNumber})
            await item.order.save();
            if(label.error){
                return NextResponse.json({error: true, msg: "error printing label"})
            }else{
                return NextResponse.json({label})
            }
        }
    }
    if(data.reprint){
        let item = await Items.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
        let order
        if(item){
            order = item.order
        }else{
            order = await Order.findOne({poNumber: data.scan.trim()}).populate("items")
        }
        let headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
            }
        }
        let res = await axios.post(`http://${process.env.localIP}/api/shipping/cpu`, {label: order.shippingInfo.label, station: data.station, barcode: "ppp"}, headers)
        console.log(res.data)
        let re2s = await updateOrder({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, orderId:order.orderId, carrierCode: "usps", trackingNumber: order.shippingInfo.labels[0].trackingNumber})
        if(res.error){
            return NextResponse.json({error: true, msg: "error printing label"})
        }else{
            return NextResponse.json({...res.data})
        }
    }
    try{
        let item = await Items.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
        let order = await Order.findOne({poNumber: data.scan.trim()}).populate("items")
        let bin 
        try{
            if(!isNaN(data.scan.trim())){
                bin = await Bins.findOne({ number: data.scan.trim() })
                .populate({ path: "order", populate: "items" });
            }
        }catch(e){
            //console.log(e)
        }
        if(data.reship){
            console.log("+++++")
            if(item){
                for(let i of item.order.items){
                    i.shipped = false
                    await i.save()
                }
                item.order.shipped = false
                item.order.preShipped = false
                await item.order.save()
                item = await Items.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
            }else if(order){
                for(let i of order.items){
                    i.shipped = false
                    await i.save()
                }
                order.shipped = false
                order.preShipped = false
                await order.save()
                order = await Order.findOne({poNumber: data.scan.trim()}).populate("items")
            }
        }
        let res = {error: false, msg: "", item, order, bin, }
        if(item){
            res.order = item.order
            if(canceled(item, item.order)){
                res.error = true
                res.msg = "Item Canceled"
            }else if(await isShipped(item) == true){
                res.error = true
                res.msg = "Order already shipped"
                console.log(res)
            }else{
                if(isSingleItem(item)) res.activate = "ship"
                else {
                    res.activate = "bin"
                    res.bin = await findBin(res.order._id)
                    let addResult = addItemToBin(item, res.bin)
                    res.item = addResult.item;
                    res.bin = addResult.bin
                    res.bin.ready = isReady(res.bin)
                    if(res.bin.ready) {
                         if((item.order.status == "shipped" || (order && order.status == "shipped")) && (item.order.shippingInfo.label == undefined || (order && order.shippingInfo.label == undefined))){
                            res.error = true
                            res.msg= "Order Already Shipped Check Ship Station for label"
                        }else{
                            res.activate = "bin/ship"
                        }
                    }
                    //console.log(res.item)
                    if (!item.steps) item.steps = [];
                    res.item.steps.push({
                        status: `In Bin ${res.bin.number}`,
                        date: new Date(),
                    });
                    await res.item.save()
                    await res.bin.save()
                }
            }
        }else if(order){
            res.bin = findBin(order._id)
            if(!res.bin.inUse) res.bin = null
            else {
                res.bin.ready = isReady(res.bin)
                await res.bin.save()
            }
            res.activate = "ship"
        }else if(bin){
            res.order = bin.order
        }
        console.log(res.activate, "activate")
        return NextResponse.json({...res})
    }catch(e){
        console.log("error", e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}


const isReady = (bin)=>{
    let ready = true;
    for(let it of bin.order.items){
        if(!bin.items.includes(it._id)) ready = false
    }
    console.log(ready, "ready")
    return ready
}
const addItemToBin = (item, bin)=>{
    if(!bin.items.map(i=> {return i.toString()}).includes(item._id.toString()) ){
        bin.items.push(item._id)
    }
    item.inBin = true;
    item.bin = bin.number;
    bin.order = item.order;
    bin.inUse = true;
    return {item, bin}
}
const findBin = async (orderId)=>{
    let bin = await Bins.findOne({order: orderId}).populate("order")
    console.log(bin, "findBin")
    if(!bin) bin = findEmptyBin()
    return bin
}
const findEmptyBin = async ()=>{
    let bin = await Bins.findOne({inUse: false})
    console.log(bin, "find Empty Bin")
    return bin
}