import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Employee from "../../../../models/employeeTracking";
import {setConfig, createImage} from "@pythias/dtf"
import axios from "axios";
const getImages = async (front, back, style, item, source)=>{
    let styleImage = style.multiImages.front.filter(i=> i.color == item.color.toString())[0]
    let backStyleImage = style.multiImages.back.filter(i=> i.color == item.color.toString())[0]
    console.log(styleImage)
    let frontDesign = front 
    let backDesign = back
    let frontCombo
    let backCombo
    if(front) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: styleImage.box[0], styleImage: styleImage.image, designImage: front })
        frontCombo = res.data.base64
    }
    if(back) {
        let res = await axios.post(`${process.env.url}/api/renderImages`, {box: backStyleImage.box[0], styleImage: backStyleImage.image, designImage: back })
        backCombo = res.data.base64
    }
    styleImage=styleImage.image
    return  {frontDesign, backDesign, styleImage, styleCode: style.code, colorName: item.colorName, frontCombo, backCombo}
}
export async function GET(req = NextApiResponse) {
    let config = JSON.parse(process.env.dtf);
    console.log(config)
    setConfig({
        internalIP: config.localIP,
        apiKey: config.apiKey
    })
    let pieceID
    let item
    if( req.nextUrl.searchParams.get("pieceID")) pieceID = req.nextUrl.searchParams.get("pieceID")
    if(pieceID) item = await Items.findOne({pieceId: pieceID}).populate("blank", "code sizes multiImages")
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
            item.lastScan = {
                station: "DTF Find",
                date: new Date(Date.now()),
                //user: user._id,
            };
            let tracking = new Employee({
                type: "DTF Find",
                Date: new Date(Date.now()),
                //employee: user,
                order: item.order,
                pieceID: item.pieceId,
            });
            await tracking.save();
            await item.save();

            console.log(item, "item");
            // console.log(style)
            const {styleImage, frontDesign, backDesign, styleCode, colorName, frontCombo, backCombo} = await getImages(item.design?.front, item.design?.back, item.blank, item)
            return NextResponse.json( {error: false,
                    msg: "here is the design",
                    pieceID: item.pieceId,
                    styleImage,
                    frontDesign,
                    backDesign,
                    styleCode,
                    colorName,
                    source: "PP",
                    frontCombo,
                    backCombo
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
    }).populate("blank", "code envelopes box sizes multiImages")
    console.log(item, "item", item.color, "item color")
    if (item && !item.canceled) {
        Object.keys(item.design).map(async key=>{
            if(key != undefined && item.design[key]){
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
        // let tracking = new Employee({
        //     type: "DTF Load",
        //     Date: new Date(Date.now()),
        //     //employee: user,
        //     order: item.order,
        //     pieceID: item.pieceId,
        //   });
        //   await tracking.save();
          item.status = "DTF Load";
          if (!item.steps) item.steps = [];
          item.steps.push({
            status: "DTF Load",
            date: new Date(),
          });
        //   item.lastScan = {
        //     station: "DTF Load",
        //     date: new Date(Date.now()),
        //     //user: user._id,
        //   };
        const {styleImage, frontDesign, backDesign, styleCode, colorName, frontCombo, backCombo} = await getImages(item.design?.front, item.design?.back, item.blank, item)
        await item.save()
        return NextResponse.json({ error: false, msg: "added to que", frontDesign, backDesign, styleImage, styleCode, colorName, source: "PP", frontCombo, backCombo });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}