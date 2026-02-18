import { NextApiRequest, NextResponse } from "next/server";
import Bins from "@/models/Bin";
import Order from "@/models/Order";
import Item from "@/models/Items";
import {updateOrder} from "@pythias/integrations";
import axios from "axios";
import {isSingleItem, isShipped, canceled} from "@/functions/itemFunctions"
export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    if(data.reprint){
        let item = await Item.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
        let order
        if(item){
            order = item.order
        }else{
            order = await Order.findOne({poNumber: data.scan.trim()})
        }
        let headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
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
        let item = await Item.findOne({ pieceId: data.scan.trim() }).populate({ path: "order", populate: "items" }).populate("blank")
        let order = await Order.findOne({poNumber: data.scan.trim()}).populate({path: "items", populate: "blank"})
        let bin 
        try{
            if(!isNaN(data.scan.trim())){
                bin = await Bins.findOne({ number: data.scan.trim() })
                .populate({ path: "order", populate: { path: "items", populate: "blank" } });
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
                item = await Item.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
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
                if(isSingleItem(item)) {
                    console.log(item, "item")
                    res.activate = "ship"
                    if(item.order.shippingType == "Standard" || item.order.shippingType == "Expedited"){
                        res.weight = item.blank.sizes.filter(s=>s.name==item.sizeName)[0]?.weight || 8
                        res.dimensions = item.blank.singleShippingDimensions || {length: 10, width: 13, height: 1}
                    }
                }
                else {
                    res.activate = "bin"
                    res.bin = await findBin(res.order._id)
                    let addResult = addItemToBin(item, res.bin)
                    res.item = addResult.item;
                    res.bin = addResult.bin
                    res.bin.ready = isReady(res.bin)
                    if(res.bin.ready) res.activate = "bin/ship"
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
        return NextResponse.json({error: true, msg: e})
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
    if(!bin) bin = findEmptyBin()
    return bin
}
const findEmptyBin = async ()=>{
    return await Bins.findOne({inUse: false})
}