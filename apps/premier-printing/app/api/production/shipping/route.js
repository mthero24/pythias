import { NextApiRequest, NextResponse } from "next/server";
import { Bin as Bins, Order, Item } from "@pythias/mongo";
import {updateOrder} from "@pythias/integrations";
import axios from "axios";
import {isSingleItem, isShipped, canceled} from "@/functions/itemFunctions"
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";
export async function POST(req= NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const sc = await getShippingCreds();
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
                "Authorization": `Bearer ${sc.localKey}`
            }
        }
        let res = await axios.post(`http://${sc.localIP}/api/shipping/cpu`, {label: order.shippingInfo.label, station: data.station, barcode: "ppp"}, headers)
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
            // Guard: never let an already-DELIVERED order be reshipped from the floor — that's the
            // accidental-rescan case (a delivered item scanned back in) that resets shipped items and
            // drags them back into production. A genuine replacement should be a new order.
            const rsOrder = item ? item.order : order;
            const delivered = (rsOrder?.shippingInfo?.labels || []).some(l => (l.trackingInfo || []).some(t => /delivered/i.test(String(t))));
            if (delivered && !data.confirmReship) {
                // Not a hard block — the scanner asks the operator to confirm, then resends with
                // confirmReship so a genuine reship can reset shipping and buy a new label.
                return NextResponse.json({ error: true, needsConfirmReship: true, msg: "This order shows as already DELIVERED. Reship anyway? This will reset shipping and buy a new label." });
            }
            if(item){
                for(let i of item.order.items){
                    i.shipped = false
                    i.status = "awaiting_shipment"   // keep item status in sync with the boolean (no ghost "Shipped")
                    await i.save()
                }
                item.order.shipped = false
                item.order.preShipped = false
                item.order.status = "awaiting_shipment"   // order is no longer shipped — revert so dashboards are accurate
                await item.order.save()
                item = await Item.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"})
            }else if(order){
                for(let i of order.items){
                    i.shipped = false
                    i.status = "awaiting_shipment"
                    await i.save()
                }
                order.shipped = false
                order.preShipped = false
                order.status = "awaiting_shipment"
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
                const isPickup = !!res.order.inStorePickup;
                // In-store pickup: always bin (even single items — no shipping label)
                if(isSingleItem(item) && !isPickup) {
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
                    if(res.bin.ready) {
                        res.activate = isPickup ? "bin/pickup" : "bin/ship"
                    }
                    if (!item.steps) item.steps = [];
                    res.item.steps.push({
                        status: `In Bin ${res.bin.number}`,
                        date: new Date(),
                    });
                    await res.item.save()
                    await res.bin.save()
                    logActivity({ action: "order_binned", entity: "order", entityId: res.order._id, entityName: res.order.poNumber || "", userName, email });
                }
            }
        }else if(order){
            res.bin = findBin(order._id)
            if(!res.bin.inUse) res.bin = null
            else {
                res.bin.ready = isReady(res.bin)
                await res.bin.save()
            }
            res.activate = order.inStorePickup ? "bin/pickup" : "ship"
        }else if(bin){
            res.order = bin.order
            if(bin.order?.inStorePickup && bin.ready) res.activate = "bin/pickup"
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