import { NextApiRequest, NextResponse } from "next/server";
import {Item as Items} from "@pythias/mongo";
import Color from "@/models/Color"
import {setConfig, createImage} from "@pythias/dtf"
import axios from "axios";
const getImages = async (item, source)=>{
    let styleImage = item.blank.blankImages.front?.filter(i=> i.color == item.color.toString())[0]
    if(!styleImage){
        let color = await Color.findOne({name: item.colorName, _id: {$ne: item.color}})
        if(color){
            styleImage = item.blank.multiImages.front.filter(i=> i.color == color._id.toString())[0]
            if(styleImage) {
                item.color = color
                item = await item.save()
            }
        }
    }
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
    styleImage=styleImage?.image
    return  {frontDesign, backDesign, upperSleeveDesign, lowerSleeveDesign, pocketDesign, centerDesign, styleImage, styleCode: style.code, colorName: item.colorName, frontCombo, backCombo, upperSleeveCombo, lowerSleeveCombo, centerCombo, pocketCombo}
}
export async function GET(req) {
    let config = JSON.parse(process.env.dtf);
    console.log(config)
    setConfig({
        internalIP: config.localIP,
        apiKey: config.apiKey
    })
    let pieceID
    let item
    if( req.nextUrl.searchParams.get("pieceID")) pieceID = req.nextUrl.searchParams.get("pieceID")
    if(pieceID) item = await Items.findOne({pieceId: pieceID}).populate("blank", "code sizes multiImages").populate("designRef", "sku")
    console.log(item)
    if(item){
        console.log(item)
        if(!item.canceled){
            item.printed = true;
            item.printedDate = new Date();
            if (item.design?.front) item.frontPrinted = true;
            if (item.design?.back) item.backPrinted = true;
            item.status = "DTF Find";
            if (!item.steps) item.steps = [];
            item.steps.push({
                status: "DTF Find",
                date: new Date(),
            });
            await item.save();

            console.log(item, "item");
            // console.log(style)
            const result = await getImages(item)
            return NextResponse.json( {error: false,
                msg: "here is the design",
                pieceID: item.pieceId,
                ...result,
                item,
                images: item.design,
                designSku: item.designRef?.sku,
                type: "new",
                source: "PP",
            })
         
        }else return NextResponse.json({error: true, msg: "Item Canceled"});
    }else return NextResponse.json({error: true, msg: "Item not found"});
}

export async function POST(req = NextApiRequest) {
    let config = JSON.parse(process.env.dtf);
    console.log(config);
    setConfig({
      internalIP: process.env.localIP,
      apiKey: "$2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW",
    });
    let data = await req.json()
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
    }).populate("blank", "code envelopes box sizes multiImages images").populate("designRef", "sku")
    console.log(item, "item", item.color, "item color")
    if (item && !item.canceled && !item.dtfScan) {
        item.dtfScan = true
        console.log(item.design, "item design")
        Object.keys(item.design).map(async key=>{
            if(key != undefined && item.design[key]){
                console.log(key, "key", item.design[key], "design key")
                let envelopes = item.blank.envelopes.filter(
                    (envelope) => (envelope.size?.toString() == item.size.toString() || envelope.sizeName == item.sizeName) && envelope.placement == key
                );
                await createImage({
                    url: item.design[key],
                    pieceID: `${item.pieceId}-${key}`,
                    horizontal: false,
                    size: `${envelopes[0].width}x${envelopes[0].height}`,
                    offset: envelopes[0].vertoffset,
                    style: item.blank.code,
                    styleSize: item.sizeName,
                    color: item.colorName,
                    sku: item.sku,
                    shouldFitDesign: null,
                    printer: data.printer
                })
            }
        })
      
          item.status = "DTF Load";
          if (!item.steps) item.steps = [];
          item.steps.push({
            status: "DTF Load",
            date: new Date(),
          });
        const result = await getImages(item.design?.front, item.design?.back, item.design?.upperSleeve, item.design?.lowerSleeve, item.design?.center, item.design?.pocket, item.blank, item)
        await item.save()
        return NextResponse.json({
            error: false, msg: "added to que", ...result, item,
            images: item.design, designSku: item.designRef?.sku, type: "new", source: "PP" });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design, designSku: item.designRef?.sku });
    }else if (item && item.dtfScan) {
        item.dtfScan = false
        await item.save()
        return NextResponse.json({ error: true, msg: "Item already Scanned Into DTF. If You Want To Resend It Scan It Again!", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}

export async function PUT(req = NextApiRequest) {
    let data = await req.json();
    //console.log(data, "data")
    try{
        let items = await Items.find({
            blank: { $ne: null },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            designRef: { $ne: null },
            design: { $ne: null },
            labelPrinted: false,
            canceled: false,
            type: "DTF",
            paid: true,
        }).populate("color", "name").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").populate("order", "poNumber items marketplace date").populate("blank", "code envelopes box sizes multiImages")
        console.log(items.length, "items to print")
        let chunks = items.length / data.printers.length;
        chunks = Math.ceil(chunks);
        console.log(chunks, "chunks")
        let send = [];
        for (let i = 0; i < data.printers.length; i++) {
            console.log(i * chunks, i * chunks + chunks, items.slice(i * chunks, i * chunks + chunks).length, "i * chunks", "i * chunks + chunks")
            send.push({ printer: data.printers[i], items: items.slice(i * chunks, i * chunks + chunks)});
        }
        //console.log(send, "send");
        for(let s of send){
            for(let item of s.items){
                if (item && !item.canceled && !item.dtfScan) {
                    item.dtfScan = true
                    Object.keys(item.design).map(async key => {
                        if (key != undefined && item.design[key]) {
                            let envelopes = item.blank.envelopes.filter(
                                (envelope) => (envelope.size?.toString() == item.size.toString() || envelope.sizeName == item.sizeName) && envelope.placement == key
                            );
                            await createImage({
                                url: item.design[key],
                                pieceID: `${item.pieceId}-${key}`,
                                horizontal: false,
                                size: `${envelopes[0].width}x${envelopes[0].height}`,
                                offset: envelopes[0].vertoffset,
                                style: item.blank.code,
                                styleSize: item.sizeName,
                                color: item.colorName,
                                sku: item.sku,
                                shouldFitDesign: null,
                                printer: s.printer
                            })
                        }
                    })

                    item.status = "DTF Load";
                    if (!item.steps) item.steps = [];
                    item.steps.push({
                        status: "DTF Load",
                        date: new Date(),
                    });
                    await item.save()
                }
            }
        }
        return NextResponse.json({ error: false, msg: `${items.length} sent to printers`, items: send });
    } catch (error) {
        console.error("Error in DTF PUT:", error);
        return NextResponse.json({ error: true, msg: "Error processing request" });
    }
}