import sharp from "sharp"
import {NextApiRequest, NextResponse} from "next/server"
import axios from "axios"
import {Blank, Design} from "@pythias/mongo";
import "jimp"
const readImage = async (url)=>{
    console.log(url)
    const response = await axios.get(
      url,
        { responseType: "arraybuffer", headers: { "Access-Control-Allow-Origin": "*", Accept: "image/png, image/jpeg" } }
    ).catch(e=>{console.log("error")});
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
    let multiplier = 1
    let base64
    if(data.width && data.box){
        multiplier = data.width / data.box.containerWidth
    }else{
        data.width = 400
    }
    base64 = await readImage(`${data.styleImage?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${data.width}&height=${data.width}`)
    console.log(data)
    console.log(data.designImage != "null", data.designImage != "undefined", "design image")
    if(data.box && data.designImage && data.designImage != "undefined" && data.designImage != "null" && base64){
                
        let designBase64
        let x = data.box.x * multiplier
        let y = data.box.y * multiplier
        let originalSize
        if(data.box.rotation && data.box.rotation != 0){
            console.log(data.box.rotation, "rotation")
            designBase64 = await readImage(`${data.designImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(data.box.boxWidth * multiplier)}&height=${parseInt(data.box.boxHeight * multiplier)}`) 
            originalSize = await designBase64.metadata();
            let originalWidth = originalSize.width;
            let originalHeight = originalSize.height;
            console.log(originalSize)
            designBase64 = await designBase64
          .rotate(parseInt(data.box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toBuffer();
            designBase64 = await sharp(designBase64)
            let newSize = await designBase64.metadata();
            designBase64 = await designBase64.toBuffer()
           // Convert rotation angle to radians
            const angleInRadians = (parseInt(data.box.rotation) * Math.PI) / 180;
            const cosTheta = Math.cos(angleInRadians);
            const sinTheta = Math.sin(angleInRadians);
            // Calculate the center points
            const centerX = originalWidth / 2;
            const centerY = originalHeight / 2;
            console.log(centerX, centerY)
            // Calculate how much the top-left corner moved during rotation around center
            const rotatedTopLeftX =
            centerX + ((0 - centerX) * cosTheta) - ((0 - centerY) * sinTheta);
            const rotatedTopLeftY =
            centerY + ((0 - centerX) * sinTheta) + ((0 - centerY) * cosTheta);
            // Adjust the position to compensate for the rotation
            console.log(rotatedTopLeftX, rotatedTopLeftY, "rotated")
            let offsetH = (newSize.height - originalHeight) / 2
            let offsetW = (newSize.width - originalWidth) / 2
            x -= (rotatedTopLeftX + offsetW);
            y -= (rotatedTopLeftY + offsetH);
        }else{
            
            designBase64 = await readImage(`${data.designImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(data.box.boxWidth * multiplier)}&height=${parseInt(data.box.boxHeight * multiplier) }`) 
            originalSize = await designBase64.metadata();
            designBase64 = await designBase64.toBuffer()
        }
        // if(data.box.rotation && data.box.rotation != 0){
        //     let radians = data.box.rotation * (Math.PI / 180)
        //     let newX =  (x * Math.cos(radians)) - (y * Math.sin(radians))
        //     let newY =  (x * Math.sin(radians)) + (y * Math.cos(radians))
        //     x= newX;
        //     y= newY
        //     console.log(x, "x", y, "y")
        //     //offset = parseInt(((data.box.x) - x))
        //    // offsetHeight = parseInt(((data.box.y) - y))
        // }
        let offset = (originalSize.width - (data.box.boxWidth * multiplier)) / 2
        base64 = await base64.composite([
            {
                input: designBase64,
                blend: 'atop',
                top: parseInt(y),
                left: parseInt(x - offset),
                gravity: "center",
            },
        ]).jpeg({ quality: 100, effort: 5 })
        .toBuffer();
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    }else if(data.styleImage && base64){
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        console.log(base64, "base64")
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    }else if(data.designImage && data.designImage != "undefined" && data.designImage != "null"){
        base64 = await readImage(`${data.designImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(data.width)}&height=${parseInt(data.width)}`) 
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        //console.log(base64, "base64")
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    }
    return base64
}
export async function GET(req){
    //console.log(req.nextUrl.searchParams.get("blank"))
    console.log(req.url.split("/")[req.url.split("/").length - 1].split(".")[0].replace(/%20/g, " "), "params")
    let base = req.url.split("/")[req.url.split("/").length - 1].split(".")[0].replace(/%20/g, " ")
    let params = base.split("-")
    console.log(params, "params")
    console.log(params[1].replace(/_/g, "-"), "params 1")
    let width = parseInt(req.nextUrl.searchParams.get("width"))
    let designImage
    let blankImage
    if(params.length == 5){
        let design = await Design.findOne({sku: params[0]}).select("images").lean()
        designImage = design?.images?.[params[4]]
        console.log(designImage, "design image", params[1], "params 1")
        let blank = await Blank.findOne({code: params[1].replace(/_/g, "-")}).populate("colors").lean()
        blankImage = blank?.multiImages[params[4]]?.filter(i=> i.image.includes(params[2]))[0]
    } else if (params.length == 6) {
        let design = await Design.findOne({ sku: params[0] }).lean()
        console.log(design.threadImages[params[5]][params[4]], "design")
        console.log(params[5], params[4], "params 5 and 4")
        designImage = design?.threadImages?.[params[5]][params[4]]
        console.log(designImage, "design image")
        let blank = await Blank.findOne({ code: params[1] }).populate("colors").lean()
        blankImage = blank.multiImages[params[4]]?.filter(i => i.image.includes(params[2]))[0]
    } else{
        let blankCode = req.nextUrl.searchParams.get("blank")
        let bm = req.nextUrl.searchParams.get("blankImage")
        let colorName = req.nextUrl.searchParams.get("colorName")
        designImage = req.nextUrl.searchParams.get("design")
        let side = req.nextUrl.searchParams.get("side")
        console.log(blankCode, bm, colorName, designImage, side)
        let blank = await Blank.findOne({code: blankCode}).populate("colors").lean()
        let color = blank.colors.filter(c=>c.name == colorName)[0]
        console.log(color, side, "color and side")
        if(bm){
            blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if(!blankImage && side == "front") blankImage = blank.multiImages["modelFront"]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if(!blankImage && side == "back") blankImage = blank.multiImages["modelBack"]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
        }
        else blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString())[0]
        if(side == "back" && blankImage == undefined){
            blankImage = blank.multiImages["modelBack"]?.filter(i=> i.color.toString() == color?._id.toString())[0]
        }
    }
    console.log(blankImage?.box[0], "box")
    let data = {box: blankImage?.box[0]? blankImage?.box[0]: null, styleImage: blankImage?.image, designImage, width}
    let base64 = await createImage(data)
    if(base64){
        base64 = base64?.replace(/^data:image\/\w+;base64,/, "")
        let buffer = new Buffer.from(base64, "base64")
        return new NextResponse(buffer, {
            headers:{
                'Content-Type': 'image/jpeg',
                "Access-Control-Allow-Origin": "*"
            }
        })
    }
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let base64 = await createImage(data)
    //console.log(base64)
    return NextResponse.json({error: false, base64})
}