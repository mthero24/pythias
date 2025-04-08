import Items from "@/models/Items";
import SkuToUpc from "@/models/skuUpcConversion"
import {NextApiRequest, NextResponse} from "next/server";
import Bins from "@/models/returnBins"

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let skuToUpc = await SkuToUpc.findOne({$or: [{sku: data.upc}, {upc: data.upc}]}).populate("design", "images sku")
    if(skuToUpc){
        let bin = await Bins.findOne({blank: skuToUpc.blank, color: skuToUpc.color, size: skuToUpc.size}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
        console.log(bin)
        if(!bin){
            bin= await Bins.findOne({inUse: false})
            bin.blank = skuUpcConversion.blank
            bin.color = skuUpcConversion.color
            bin.size = skuUpcConversion.size
            bin.inUse = true
        }
        let inv = bin.inventory.filter(iv=> iv.upc == data.upc || iv.sku == data.upc)[0]
        if(inv){
            inv.quantity++
            console.log(inv.quantity, "quantity")
        }else{
            inv = {
                upc: skuToUpc.upc,
                sku: skuToUpc.sku,
                design: skuToUpc.design,
                quantity: 1
            }
            bin.inventory.push(inv)
        }
        bin.inUse = true
        await bin.save()
        let bins = await Bins.find({inUse: true}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
        //console.log(bin, "later bin")
        return NextResponse.json({error: false, bin, bins})
    }
    return NextResponse.json({error: true, msg: "Look up SKU or UPC on the design page!!!"})

}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data.bin)
    await Bins.findByIdAndUpdate(data.bin._id, {...data.bin})
    return NextResponse.json({error: false})
}
export async function DELETE(req){
    let binId = await req.nextUrl.searchParams.get("bin")
    let bin = await Bins.findOne({_id: binId}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name") 
    bin.blank = null
    bin.color = null
    bin.size = null
    bin.inventory = []
    bin.inUse = false
    await bin.save()
    let bins = await Bins.find({inUse: true}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
    //console.log(bin, "later bin")
    return NextResponse.json({error: false, bin, bins})
}