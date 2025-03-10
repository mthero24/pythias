import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Employee from "../../../../models/employeeTracking";
import Color from "@/models/Color"
import {setConfig, createImage} from "@pythias/dtf"
import axios from "axios";
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
            await item.save();

            console.log(item, "item");
            // console.log(style)
            const result = await getImages(item.design?.front, item.design?.back, item.design?.upperSleeve, item.design?.lowerSleeve, item.design?.center, item.design?.pocket, item.blank, item)
            return NextResponse.json( {error: false,
                    msg: "here is the design",
                    pieceID: item.pieceId,
                    ...result,
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
        const result = await getImages(item.design?.front, item.design?.back, item.design?.upperSleeve, item.design?.lowerSleeve, item.design?.center, item.design?.pocket, item.blank, item)
        await item.save()
        return NextResponse.json({ error: false, msg: "added to que", ...result, source: "PP" });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}