import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Employee from "../../../../models/employeeTracking";
import Style from "../../../../models/StyleV2";
export const createImage = (colorName, styleCode, options, width=700) => {
    let side = 'garment';
    if(options.side){
        side = options.side;
    }
    //console.log(side)
    if(!colorName) return ''
    let url;
    if(options.url){
        url = `https://images3.teeshirtpalace.com/images/productImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?url=${options.url}&width=${width}`;
    }
    if(options.sku){
        url = `https://images3.teeshirtpalace.com/images/productImages/${options.sku}--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?width=${width}`;
    }
   // console.log(url, 'url')
   //console.log(url)
    return url;
};
export async function GET(req = NextResponse) {
    let pieceID
    let item
    if( req.nextUrl.searchParams.get("pieceID")) pieceID = req.nextUrl.searchParams.get("pieceID")
    if(pieceID) item = await Items.findOne({pieceId: pieceID})
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

            let style = await Style.findOne({ _id: item.styleV2._id })
                .select("images")
                .lean();
            // console.log(style)

            let styleImage = style.images.filter(
                (i) => i.color.toString() == item.color._id.toString()
            )[0];
            if (styleImage) {
                styleImage = styleImage.image + "?width=400";
            }

            let frontDesign =
                item.design?.front &&
                item.design?.front.replace(
                "s3.wasabisys.com/teeshirtpalace-node-dev/",
                "images2.teeshirtpalace.com/"
                ) + "?width=400";
            let backDesign =
                item.design.back &&
                item.design.back.replace(
                "s3.wasabisys.com/teeshirtpalace-node-dev/",
                "images2.teeshirtpalace.com/"
                ) + "?width=400";
            return NextResponse.json( {error: false,
                    msg: "here is the design",
                    pieceID: item.pieceId,
                    styleImage,
                    frontDesign: frontDesign,
                    backDesign,
                    design: {
                    front: createImage(
                        item.color.name,
                        item.styleV2.code,
                        { url: item.design?.front },
                        300
                    ),
                    back: item.design.back
                        ? createImage(
                            item.color.name,
                            item.styleV2.code,
                            { url: item.design.back, side: "back" },
                            300
                        )
                        : null,
                    }});
         
        }else return NextResponse.json({error: true, msg: "Item Canceled"});
    }else return NextResponse.json({error: true, msg: "Item not found"});
}