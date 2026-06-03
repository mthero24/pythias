export const dynamic = "force-dynamic";
import { NextApiRequest, NextResponse } from "next/server";
import { PlatformItem as Items, Color } from "@pythias/mongo";
import {sendFile} from "@pythias/embroidery"
import { getToken } from "next-auth/jwt";
import axios from "axios";
import { getShippingCreds } from "@/lib/getShippingCreds";
const getImages = async (front, back, upperSleeve, lowerSleeve, center, pocket, style, item, source)=>{
    let styleImage = style.multiImages.front?.filter(i=> i.color == item.color.toString())[0]
    if(!styleImage){
        let color = await Color.findOne({name: item.colorName, _id: {$ne: item.color}})
        if(color){
            styleImage = style.multiImages.front.filter(i=> i.color == color._id.toString())[0]
            if(styleImage) {
                item.color = color
                item = await item.save()
            }
        }
    }
    let backStyleImage = style.multiImages.back?.filter(i=> i.color == item.color.toString())[0]
    let upperSleeveStyleImage = style.multiImages.upperSleeve?.filter(i=> i.color == item.color.toString())[0]
    let lowerSleeveStyleImage = style.multiImages.lowerSleeve?.filter(i=> i.color == item.color.toString())[0]
    let centerStyleImage = style.multiImages.center?.filter(i=> i.color == item.color.toString())[0]
    let pocketStyleImage = style.multiImages.pocket?.filter(i=> i.color == item.color.toString())[0]
    console.log(styleImage)
    let frontDesign = front 
    let backDesign = back
    let upperSleeveDesign = upperSleeve
    let lowerSleeveDesign = lowerSleeve
    let centerDesign = center
    let pocketDesign = pocket
    let frontCombo
    let backCombo
    let upperSleeveCombo
    let lowerSleeveCombo
    let centerCombo
    let pocketCombo
    if(front) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: styleImage?.box[0], styleImage: styleImage?.image, designImage: front })
        frontCombo = res.data.base64
    }
    if(back) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: backStyleImage?.box[0], styleImage: backStyleImage?.image, designImage: back })
        backCombo = res.data.base64
    }
    if(upperSleeve) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: upperSleeveStyleImage?.box[0], styleImage: upperSleeveStyleImage?.image, designImage: upperSleeve })
        upperSleeveCombo = res.data.base64
    }
    if(lowerSleeve) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: lowerSleeveStyleImage?.box[0], styleImage: lowerSleeveStyleImage?.image, designImage: lowerSleeve })
        lowerSleeveCombo = res.data.base64
    }
    if(pocket) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: pocketStyleImage?.box[0], styleImage: pocketStyleImage?.image, designImage: pocket })
        pocketCombo = res.data.base64
    }
    if(center) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: centerStyleImage?.box[0], styleImage: centerStyleImage?.image, designImage: center })
        centerCombo = res.data.base64
    }
    styleImage=styleImage?.image
    return  {frontDesign, backDesign, upperSleeveDesign, lowerSleeveDesign, pocketDesign, centerDesign, styleImage, styleCode: style.code, colorName: item.colorName, frontCombo, backCombo, upperSleeveCombo, lowerSleeveCombo, centerCombo, pocketCombo}
}

export async function GET(){
    return NextResponse.json({error: false})
}
export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const sc = await getShippingCreds();
    let data = await req.json()
    const tajimaQueue = data.tajimaQueue || "default";
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
        orgId,
    }).populate("designRef", "embroideryFiles").populate("blank", "code envelopes box sizes multiImages")
    console.log(item, "item", item.color, "item color")
    if (item && !item.canceled) {
        await Promise.all(Object.keys(item.designRef.embroideryFiles).map(async key => {
            if (key != undefined && item.designRef.embroideryFiles[key]) {
                await sendFile({
                    url: item.designRef.embroideryFiles[key],
                    pieceID: `${item.pieceId}-${key}`,
                    style: item.blank.code,
                    styleSize: item.sizeName,
                    color: item.colorName,
                    sku: item.sku,
                    printer: data.printer,
                    key: sc.localKey,
                    localIP: sc.localIP
                })
            }
        }))

        // Queue DST file on the Tajima spooler if present
        if (item.designRef?.embroideryFiles?.dst) {
            try {
                const dstRes = await axios.get(item.designRef.embroideryFiles.dst, { responseType: "arraybuffer" });
                const dstBase64 = Buffer.from(dstRes.data).toString("base64");
                const designName = `${item.pieceId}-${item.sku}.dst`;
                await axios.post(
                    `http://${sc.localIP}/api/tajima/send`,
                    { name: designName, dstBase64, machine: tajimaQueue },
                    { headers: { Authorization: `Bearer ${sc.localKey}` } }
                );
                console.log(`[tajima] Queued DST for ${item.pieceId} → queue "${tajimaQueue}"`);
            } catch (e) {
                console.error(`[tajima] Failed to queue DST: ${e.message}`);
            }
        }
        item.status = "DTF Load";
        if (!item.steps) item.steps = [];
        item.steps.push({
            status: "Embroidery Load",
            date: new Date(),
        });
        const result = await getImages(item.design?.front, item.design?.back, item.design?.upperSleeve, item.design?.lowerSleeve, item.design?.center, item.design?.pocket, item.blank, item)
        await item.save()
        return NextResponse.json({ error: false, msg: "added to que", ...result, source: "PP"});
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}