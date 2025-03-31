import sharp from "sharp"
import {NextApiRequest, NextResponse} from "next/server"
import axios from "axios"
import Blanks from "@/models/Blanks"
import "jimp"
const readImage = async (url)=>{
    console.log(url)
    const response = await axios.get(
      url,
      { responseType: "arraybuffer" }
    ).catch(e=>{});
    //console.log(response.headers)
    if(response){
        const buffer = Buffer.from(response.data, "binary");

        // Use sharp to process the image
        let image = sharp(buffer);
        return image
    }
    return null
}
const createImage = async (data)=>{
    let base64
    base64 = await readImage(data.styleImage)
    //onsole.log(data.box && data.designImage && base64)
    if(data.box && data.designImage && base64){
        base64 = base64.resize({
            width: data.box.containerWidth ,
            height: data.box.containerHeight,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        let designBase64 = await readImage(data.designImage)
        designBase64 = designBase64.trim()
        if(data.box.rotation){
            console.log(data.box.rotation, "rotation")
            designBase64 = designBase64.rotate(parseInt(data.box.rotation), {background: {r: 0, g: 0, b: 0, alpha: 0}}).resize({
                width: parseInt(data.box.boxWidth),
                height: parseInt(data.box.boxHeight),
                background: {r: 0, g: 0, b: 0, alpha: 0},
                fit: sharp.fit.inside,
                position: sharp.strategy.attention,
                fastShrinkOnLoad: false 
            })
        }else{
            designBase64 = await designBase64.resize({
                width: parseInt(data.box.boxWidth ),
                height: parseInt(data.box.boxHeight),
                background: {r: 0, g: 0, b: 0, alpha: 0},
                fit: sharp.fit.inside,
                position: sharp.strategy.attention,
                fastShrinkOnLoad: false 
            })
        }
        designBase64 = await designBase64.toBuffer();
        designBase64 = await sharp(designBase64)
        const metadata = await designBase64.metadata()
        designBase64 = await designBase64.toBuffer();
        designBase64 = await sharp(designBase64)
        const metadata2 = await designBase64.metadata()
        console.log(data.box)
        designBase64 = await designBase64.toBuffer();
        console.log(metadata2.width - metadata.width, "mw - 2w", metadata2.height - metadata.height, "mh - 2h")
        let row = (metadata2.width - metadata.width) / 2
        let roh = metadata2.height - metadata.height
        console.log(metadata.width, metadata.height, 'meta', metadata2.width,  metadata2.height, (metadata2.height/ 2), parseInt((data.box.boxHeight)/ 2), 'meta2', parseInt(data.box.boxWidth), parseInt(data.box.boxHeight), "box")
        let offset = parseInt(((data.box.boxWidth) - (metadata2.width)) /2)
        let offsetHeight
        let x = data.box.x 
        let y = data.box.y
        console.log(x, "x", y, "y")
        if(data.box.rotation){
            let radians = data.box.rotation * (Math.PI / 180)
            let newX =  (x * Math.cos(radians)) - (y * Math.sin(radians))
            let newY =  (x * Math.sin(radians)) + (y * Math.cos(radians))
            x= newX;
            y= newY
            console.log(x, "x", y, "y")
            offset = parseInt(((data.box.boxWidth) - x) /2)
            //offsetHeight = parseInt(((data.box.boxHeight) - y) /2)
        }
        console.log(offset, "offset", offsetHeight, "offset height")
        base64 = await base64.composite([
            {
                input: designBase64,
                blend: 'atop',
                top: parseInt(y - (offsetHeight? offsetHeight: 0)),
                left: parseInt(x + (offset? offset: 0)),
                gravity: "center",
            },
        ]).png({ quality: 95 })
        .toBuffer();
        base64 = `data:image/png;base64,${base64.toString("base64")}`
    }else if(data.styleImage && base64){
        base64 = base64.resize({
            width: 400,
            height: 400,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        base64 = await base64.png().toBuffer();
        //console.log(base64, "base64")
        base64 = `data:image/png;base64,${base64.toString("base64")}`
    }else if(data.designImage){
        base64 = await readImage(data.designImage)
        if(base64){
            base64 = base64.resize({
                width: 400,
                height: 400,
                fit: sharp.fit.cover,
                position: sharp.strategy.entropy
            })
            base64 = await base64.png().toBuffer();
            //console.log(base64, "base64")
            base64 = `data:image/png;base64,${base64.toString("base64")}`
        }
    }
    return base64
}
export async function GET(req){
    //console.log(req.nextUrl.searchParams.get("blank"))
    let blankCode = req.nextUrl.searchParams.get("blank")
    let bm = req.nextUrl.searchParams.get("blankImage")
    let colorName = req.nextUrl.searchParams.get("colorName")
    let designImage = req.nextUrl.searchParams.get("design")
    let side = req.nextUrl.searchParams.get("side")
    //console.log(blankCode, colorName, designImage, side)
    let blank = await Blanks.findOne({code: blankCode}).populate("colors").lean()
    let color = blank.colors.filter(c=>c.name == colorName)[0]
    //console.log(color)
    let blankImage
    if(bm){
        blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
    }
    else blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString())[0]
    //console.log(blankImage?.box[0], "box")
    let data = {box: blankImage?.box[0]? blankImage?.box[0]: null, styleImage: blankImage?.image, designImage}
    let base64 = await createImage(data)
    base64 = base64.replace(/^data:image\/\w+;base64,/, "")
    let buffer = new Buffer.from(base64, "base64")
    return new NextResponse(buffer, {
        headers:{
            'Content-Type': 'image/png',
        }
    })
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let base64 = await createImage(data)
    //console.log(base64)
    return NextResponse.json({error: false, base64})
}