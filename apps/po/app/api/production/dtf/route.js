import { NextApiRequest, NextResponse } from "next/server";
import Items from "@/models/Items";
import Style from "@/models/StyleV2";
import {setConfig, createImage} from "@pythias/dtf"
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
            "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev/",
        "https://images2.teeshirtpalace.com/"
            ).replace(
        "https://s3.wasabisys.com/teeshirtpalace-node-dev/",
        "https://images2.teeshirtpalace.com/"
      ).replace(
            "s3.wasabisys.com/images2.tshirtpalace.com/",
            "images2.teeshirtpalace.com/"
        ) + "?width=400";
        else backDesign = item.design[d]?.replace(
            "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev/",
        "https://images2.teeshirtpalace.com/"
            ).replace(
        "https://s3.wasabisys.com/teeshirtpalace-node-dev/",
        "https://images2.teeshirtpalace.com/"
      ).replace(
            "s3.wasabisys.com/images2.tshirtpalace.com/",
            "images2.teeshirtpalace.com/"
        ) + "?width=400";
    })
    console.log(frontDesign, "front design from getImages")
    return  {frontDesign, backDesign, styleImage, styleCode: style.code, colorName: item.colorName}
}
export async function GET(req = NextApiRequest) {
    let config = JSON.parse(process.env.dtf);
    console.log(config)
    setConfig({
        internalIP: config.localIP,
        apiKey: config.apiKey
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
                    colorName,
                    images: item.design, type: "new"
            })
         
        }else return NextResponse.json({error: true, msg: "Item Canceled"});
    }else return NextResponse.json({error: true, msg: "Item not found"});
}

export async function POST(req = NextApiRequest) {
    let config = JSON.parse(process.env.dtf);
    console.log(config);
    setConfig({
      internalIP: process.env.localIP,
      apiKey: "$2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy",
    });
    let data = await req.json()
    console.log(data, "data")
    let item = await Items.findOne({
        pieceId: data.pieceId.toUpperCase().trim(),
    })
    console.log(item?.design, "item",)
    if(!item){
        let items = await Items.find({bulkId: data.pieceId.toUpperCase().trim()})
        let quantity = await Items.find({ bulkId: data.pieceId.toUpperCase().trim() }).countDocuments()
        let style = await Style.findOne({_id: items[0].styleV2._id}).select("code envelopes box sizes images")
        console.log(items.length, "bulk items")
        let designs = []
        for(let it of items){
            for(let key of Object.keys(it.design)){
                if(!designs.includes(it.design[key])){
                    designs.push(it.design[key])
                }
            }
        }
        let itemsToSend = []
        for(let d of designs){
            for(let item of items){
                let found = false
                for(let key of Object.keys(item.design)){
                    if(item.design[key] == d){
                        itemsToSend.push(item)
                        found = true
                        break;
                    }
                }
                if(found) break;
            }
        }
        if(designs.length > 0){
            for(let item of itemsToSend){
                console.log("sending item to dtf")
                item.dtfScan = true
                item.styleV2 = style
                let shouldFitDesign = item?.styleV2?.box?.default?.front?.autoFit;
                Object.keys(item.design).map(async im => {
                    //console.log(item.styleV2.envelopes)
                    if (im && im != "") {
                        console.log(item.design[im], item.size, im, "im")
                        //console.log(item.styleV2.envelopes)
                        let envelope = item.styleV2.envelopes.filter(ev => (ev.sizeName == item.sizeName || ev.size?.toString() == item.size?.toString()) && im == ev.placement)[0]
                        if (!envelope) envelope = item.styleV2.envelopes.filter(ev => im == ev.placement)[0]
                        console.log(envelope)
                        await createImage({
                            url: item.design[im],
                            pieceID: `${item.pieceId}-${im}`,
                            horizontal: false,
                            size: `${envelope.width}x${envelope.height}`,
                            offset: envelope.vertoffset,
                            style: item.styleV2.code,
                            styleSize: item.sizeName,
                            color: item.color.name,
                            sku: item.sku,
                            shouldFitDesign: shouldFitDesign,
                            printer: data.printer,
                            quantity: 1
                        })
                    }
                })
                //console.log(imageres)

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
                await item.save();
            }
            const { styleImage, frontDesign, backDesign, styleCode, colorName } = await getImages(items[0].design.front, items[0].design.back, items[0].styleV2, items[0])
            console.log(frontDesign, backDesign,)
            return NextResponse.json({ error: false, msg: "added to que", frontDesign, backDesign, styleImage, styleCode, colorName, images: items[0].design, type: "new" });
        } else {
            return NextResponse.json({ error: true, msg: "no designs found" });
        }
    }else if (item && !item.canceled && !item.shipped && !item.dtfScan) {
        item.dtfScan = true
        let style = await Style.findOne({ _id: item.styleV2._id }).select("code envelopes box sizes images")
        item.styleV2 = style
        let shouldFitDesign = item?.styleV2?.box?.default?.front?.autoFit;
        Object.keys(item.design).map(async im=>{
            //console.log(item.styleV2.envelopes)
            if(im && im != ""){
                console.log(item.design[im], item.size, im, "im")
                //console.log(item.styleV2.envelopes)
                let envelope = item.styleV2.envelopes.filter(ev=> (ev.sizeName == item.sizeName || ev.size?.toString() == item.size?.toString()) && im == ev.placement)[0]
                if(!envelope) envelope = item.styleV2.envelopes.filter(ev=> im == ev.placement)[0]
                console.log(envelope)
                await createImage({
                    url: item.design[im],
                    pieceID: `${item.pieceId}-${im}`,
                    horizontal: false,
                    size: `${envelope.width}x${envelope.height}`,
                    offset: envelope.vertoffset,
                    style: item.styleV2.code,
                    styleSize: item.sizeName,
                    color: item.color.name,
                    sku: item.sku,
                    shouldFitDesign: shouldFitDesign,
                    printer: data.printer,
                    quantity: 1
                })
            }
        })
        //console.log(imageres)
        
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
          await item.save();
        const {styleImage, frontDesign, backDesign, styleCode, colorName} = await getImages(item.design.front, item.design.back, item.styleV2, item)
        console.log(frontDesign, backDesign,)
        return NextResponse.json({ error: false, msg: "added to que", frontDesign, backDesign, styleImage, styleCode, colorName, images: item.design, type: "new" });
    }else if (item && item.canceled) {
        return NextResponse.json({ error: true, msg: "item canceled", design: item.design });
    } else if (item && item.shipped) {
        return NextResponse.json({ error: true, msg: "item Shipped", design: item.design });
    } else if (item && item.dtfScan) {
        item.dtfScan = false
        await item.save();
        return NextResponse.json({ error: true, msg: "Item Already Scanned Into DTF Scan Again To Resend", design: item.design });
    }else {
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
            type: "DTF",
            canceled: false,
            paid: true,
        }).populate("color", "name").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").populate("order", "poNumber items marketplace date").populate("blank", "code envelopes box sizes multiImages")
        console.log(items.length, "items to print")
        items = items.filter(i => i.inventory?.inventory && i.inventory?.inventory?.inventoryType == "inventory" && i.inventory?.inventory?.inventory.inStock.includes(i._id.toString()))
        let chunks = items.length / data.printers.length;
        chunks = Math.ceil(chunks);
        let send = [];
        for (let i = 0; i < data.printers.length; i++) {
            send.push({ printer: data.printers[i], items: items.slice(i * chunks, i * chunks + chunks)});
        }
        console.log(send, "send");
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