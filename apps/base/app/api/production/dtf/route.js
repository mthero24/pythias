import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Employee from "../../../../models/employeeTracking";
import {setConfig, createImage} from "@pythias/dtf"
const getImages = async (front, back, style, item)=>{
    let styleImage = style.images.filter(
        (i) => i.color.toString() == item.color?._id.toString()
    )[0];

    if (styleImage) {
        styleImage = styleImage.image + "?width=400";
    }

    let frontDesign =
        front && front.replace(
        "s3.wasabisys.com/teeshirtpalace-node-dev/",
        "images2.teeshirtpalace.com/"
        ) + "?width=400";
    let backDesign =
        back && back.replace(
        "s3.wasabisys.com/teeshirtpalace-node-dev/",
        "images2.teeshirtpalace.com/"
        ) + "?width=400";
    return  {frontDesign, backDesign, styleImage, styleCode: style.code, colorName: item.colorName}
}
export async function GET(req = NextResponse) {
    let config = JSON.parse(process.env.dtf);
    console.log(config)
    setConfig({
        internalIP: config.localIP
    })
    let pieceID
    let item
    if( req.nextUrl.searchParams.get("pieceID")) pieceID = req.nextUrl.searchParams.get("pieceID")
    if(pieceID) item = await Items.findOne({pieceId: pieceID}).populate("styleV2", "code sizes images")
    console.log(item)
    if(item){
        console.log(item)
        if(!item.canceled){
            item.printed = true;
            item.printedDate = new Date();
            if (item.design?.front) item.frontPrinted = true;
            if (item.design.back) item.backPrinted = true;
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
            const {styleImage, frontDesign, backDesign, styleCode, colorName} = await getImages(item.design?.front, item.design?.back, item.styleV2, item)
            return NextResponse.json( {error: false,
                    msg: "here is the design",
                    pieceID: item.pieceId,
                    styleImage,
                    frontDesign,
                    backDesign,
                    styleCode,
                    colorName
            })
         
        }else return NextResponse.json({error: true, msg: "Item Canceled"});
    }else return NextResponse.json({error: true, msg: "Item not found"});
}

export async function POST(req = NextApiRequest) {
    let config = JSON.parse(process.env.dtf);
   // console.log(config);
    setConfig({
      internalIP: config.localIP,
    });
    let data = await req.json()
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
    }).populate("styleV2", "code envleopes box sizes images")
    console.log(item, "item", item.color, "item color")
    if (item && !item.canceled) {
        let envleopes = item.styleV2.envleopes.filter(
            (envelope) => envelope.size?.toString() == item.size.toString()
        );
        //console.log(envleopes)
        if (envleopes.length == 0) {
        let updatedSize = item.styleV2.sizes.filter(
            (s) => s.name.toLowerCase() == item.sizeName.toLowerCase()
        )[0];
        //console.log(updatedSize, "size");
        item.size = updatedSize._id;
        envleopes = item.styleV2.envleopes.filter(
            (envelope) => envelope.size.toString() == item.size.toString()
        );
        }
        let shouldFitDesign = item?.styleV2?.box?.default?.front?.autoFit;
        let imageres = await createImage({
            url: item.design?.front,
            pieceID: item.pieceId,
            horizontal: false,
            size: `${envleopes[0].width}x${envleopes[0].height}`,
            offset: envleopes[0].vertoffset,
            style: item.styleV2.code,
            styleSize: item.sizeName,
            color: item.color.name,
            sku: item.sku,
            shouldFitDesign: shouldFitDesign,
            printer: data.printer
        })
        console.log(imageres)
        let tracking = new Employee({
            type: "DTF Load",
            Date: new Date(Date.now()),
            //employee: user,
            order: item.order,
            pieceID: item.pieceId,
          });
          await tracking.save();
          item.status = "DTF Load";
          if (!item.steps) item.steps = [];
          item.steps.push({
            status: "DTF Load",
            date: new Date(),
          });
          item.lastScan = {
            station: "DTF Load",
            date: new Date(Date.now()),
            //user: user._id,
          };
        const {styleImage, frontDesign, backDesign, styleCode, colorName} = await getImages(item.design?.front, item.design?.back, item.styleV2, item)
        return NextResponse.json({ error: false, msg: "added to que", frontDesign, backDesign, styleImage, styleCode, colorName });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else {
        return NextResponse.json({ error: true, msg: "item not found" });
    }
}