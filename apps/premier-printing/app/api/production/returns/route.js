import Items from "@/models/Items";
import SkuToUpc from "@/models/skuUpcConversion"
import {NextApiRequest, NextResponse} from "next/server";
import Bins from "@/models/returnBins"

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let bin = await Bins.findOne({$or: [{sku: data.upc}, {upc: data.upc}]}).populate("design color blank")
    console.log(bin)
    if(!bin){
        bin= await Bins.findOne({inUse: false})
        let item = await Items.findOne({$or: [{sku: data.upc}, {upc: data.upc}]}).populate("designRef color blank")
        if(item){
            bin.design = item.designRef
            bin.upc = item.upc
            bin.sku = item.sku
            bin.blank = item.blank
            bin.color = item.color
            bin.size = item.sizeName
        }else{
            let skuUpcConversion = (await SkuToUpc.findOne({$or: [{sku: data.upc}, {upc: data.upc}]})).populate("design color blank")
            bin.design = skuUpcConversion.design
            bin.upc = skuUpcConversion.upc
            bin.sku = skuUpcConversion.sku
            bin.blank = skuUpcConversion.blank
            bin.color = skuUpcConversion.color
            bin.size = skuUpcConversion.size
        }
        if(bin.upc) bin.inUse = true
        await bin.save()
    }
    bin.inUse = true
    await bin.save()
    console.log(bin, "later bin")
    return NextResponse.json({error: false, bin})

}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    let newQty = parseInt(data.bin.quantity) + parseInt(data.qty)
    if(newQty <= 0){
        data.bin.quantity = 0
        data.bin.design = null;
        data.bin.upc = null;
        data.bin.sku = null;
        data.bin.blank = null
        data.bin.size = null
        data.bin.inUse = false
        await Bins.findByIdAndUpdate(data.bin._id, {inUse: false, quantity: 0})
    }else{
        await Bins.findByIdAndUpdate(data.bin._id, {quantity: newQty})
    }
    let bins = await Bins.find({inUse: true}).populate("design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
    return NextResponse.json({error: false, bins})
}