import { NextApiRequest, NextResponse } from "next/server";
import Bins from "../../../../models/Bin";
import Order from "../../../../models/Order";
import Item from "../../../../models/Items";

export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    try{
        let item = await Item.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
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
        let res = {error: false, msg: "", item, order, bin, }
        if(item){
            res.order = item.order
            if(canceled(item, item.order)){
                res.error = true
                res.msg = "Item Canceled"
            }else{
                if(isSingleItem(item)) res.activate = "ship"
                else {
                    res.activate = "bin"
                    res.bin = await findBin(res.order._id)
                    let addResult = addItemToBin(item, res.bin)
                    res.item = addResult.item;
                    res.bin = addResult.bin
                    res.bin.ready = isReady(res.bin)
                    if(res.bin.ready) res.activate = "bin/ship"
                    //console.log(res.item)
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
        console.log(res.activate)
        return NextResponse.json({...res})
    }catch(e){
        console.log("error", e)
        return NextResponse.json({error: true, msg: e})
    }
}

const isSingleItem = (item)=>{
    console.log(item.order.items.filter(i=> !i.canceled && !i.shipped).length, "isSingle")
    if(item.order.items.filter(i=> !i.canceled && !i.shipped).length > 1) return false
    else return true
}
const canceled = (item, order)=>{
    if(item.canceled == true || order.canceled == true) return true
    else return false
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
    if(!bin.items.includes(item._id) ){
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