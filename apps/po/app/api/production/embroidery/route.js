import { NextApiRequest, NextResponse } from "next/server";
import Items from "@/models/Items";
import Color from "@/models/Color"
import {sendFile} from "@pythias/embroidery"
import axios from "axios";
const getImages = async (front, back, style, item)=>{
    let styleImage = style.images.filter(
        (i) => i.color.toString() == item.color?._id.toString()
    )[0];

    if (styleImage) {
        styleImage = styleImage.image + "?width=400";
    }
    let backDesigns = ["namePlate", "back"]
    let frontDesign
    let backDesign
    Object.keys(item.design).map(d=>{
        if(!backDesigns.includes(d)) frontDesign = item.design[d]?.replace(
            "s3.wasabisys.com/teeshirtpalace-node-dev/",
            "images2.teeshirtpalace.com/"
            ) + "?width=400";
        else backDesign = item.design[d]?.replace(
            "s3.wasabisys.com/teeshirtpalace-node-dev/",
            "images2.teeshirtpalace.com/"
            ) + "?width=400";
    })
    return  {frontDesign, backDesign, styleImage, styleCode: style.code, colorName: item.colorName}
}

export async function GET(){
    return NextResponse.json({error: false})
}
export async function POST(req = NextApiRequest) {
    let data = await req.json()
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
    }).populate("styleV2", "code envelopes box sizes multiImages images")
    console.log(item.design, "item",)
    if (item && !item.canceled) {
        Object.keys(item.printFiles).map(async key=>{
            if(key != undefined && item.printFiles[key]){
                await sendFile({
                    url: item.printFiles[key],
                    pieceID: `${item.pieceId}-${key}`,
                    style: item.blank.code,
                    styleSize: item.sizeName,
                    color: item.colorName,
                    sku: item.sku,
                    printer: data.printer,
                    key: "$2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy",
                    localIP:process.env.localIP
                })
            }
        })
        item.status = "DTF Load";
        if (!item.steps) item.steps = [];
        item.steps.push({
            status: "Embroidery Load",
            date: new Date(),
        });
        await item.save()
        const {styleImage, frontDesign, backDesign, styleCode, colorName} = await getImages(item.design.front, item.design.back, item.styleV2, item)
        return NextResponse.json({ error: false, msg: "added to que", frontDesign, backDesign, styleImage, styleCode, colorName, images: item.design, type: "new" });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}