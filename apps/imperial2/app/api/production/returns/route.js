import Items from "@/models/Items";
import SkuToUpc from "@/models/skuUpcConversion"
import {NextApiRequest, NextResponse} from "next/server";
import { ReturnBins as Bins } from "@pythias/mongo"
import Design from "@/models/Design";
import Color from "@/models/Color";
import Blanks from "@/models/Blanks";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data.upc, "upc")
    let blank
    let design
    let color
    let size
    let threadColor
    design = await Design.findOne({sku: data.upc.split("_")[1]})
    color = await Color.findOne({$or: [{name: data.upc.split("_")[2]}, {sku: data.upc.split("_")[2]}]})
    blank = await Blanks.findOne({code: data.upc.split("_")[4]})
    if(blank){
        size= blank.sizes.filter(s=> s.name == data.upc.split("_")[3])[0]
    }
    if(data.upc.split("_")[5]){
        threadColor = await Color.findOne({$or: [{name: data.upc.split("_")[5]}, {sku: data.upc.split("_")[5]}]})
    }
    console.log(design, blank, size, color)
    if(design, blank, size, color){
        let bin = await Bins.findOne({blank: blank.id, color: color._id, size: size.name}).populate("inventory.design", "sku images threadImages").populate("blank", "sizes code multiImages").populate("color", "name")
        console.log(bin)
        if(!bin){
            bin= await Bins.findOne({inUse: false})
            bin.blank = blank
            bin.color = color
            bin.size = size.name
            bin.inUse = true
        }
        let inv = bin.inventory.filter(iv=> iv.upc == data.upc || iv.sku == data.upc)[0]
        if(inv){
            inv.quantity++
            console.log(inv.quantity, "quantity")
        }else{
            inv = {
                sku: data.upc,
                design: design,
                threadColor: threadColor,
                quantity: 1
            }
            bin.inventory.push(inv)
        }
        bin.inUse = true
        await bin.save()
        let bins = await Bins.find({inUse: true}).populate("inventory.design", "sku images threadImages").populate("inventory.threadColor", "name").populate("blank", "sizes code multiImages").populate("color", "name")
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