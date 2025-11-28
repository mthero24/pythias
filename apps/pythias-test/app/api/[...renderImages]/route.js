import sharp from "sharp"
import {NextApiRequest, NextResponse} from "next/server"
import axios from "axios"
import { Blank, Design } from "@pythias/mongo";
import "jimp"
const readImage = async (url)=>{
    const response = await axios.get(
      url,
      { responseType: "arraybuffer" }
    ).catch(e=>{});
    if(response){
        const buffer = Buffer.from(response.data, "binary");

        // Use sharp to process the image
        let image = sharp(buffer);
        return image
    }
    return null
}
const createSide = async ({points, baseImage, subImage, type, side, layers}) => {
    //console.log("Creating side:", type, side, subImage, baseImage)
    let img = await readImage(`${baseImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
    img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    await img.toFile("./baseImage.png")
    let coords = []
    for(let p = 0; p < points.length -1; p+=2){
        coords.push({x: points[p], y: points[p + 1]})
    }
    //console.log(coords)
    let minx = parseInt(coords.reduce((min, box) => box.x < min ? box.x : min, Infinity));
    let miny = parseInt(coords.reduce((min, box) => box.y < min ? box.y : min, Infinity));
    let maxx = parseInt(coords.reduce((max, box)=> box.x > max? box.x: max, 0))
    let maxy = parseInt(coords.reduce((max, box) => box.y > max ? box.y : max, 0))
   // console.log({ minx, miny, maxx, maxy })
    let colorImage = sharp({
        create: {
            width: 400,
            height: 400,
            channels: 4,
            background: { r: 2, g: 2, b: 2, alpha: 0 }
        }
    }).png();
    // img = await newImage.composite([{ input: await img.toBuffer(), left: 0, top: 0 }]).png();
     await img.toFile("./newImage.png")
    let color = await readImage(subImage);
    let colorMeta = await color.metadata();
    //console.log("colorMeta", colorMeta);
    if(type === "sleeve"){
        let sleeveMeta = await color.metadata();
        //console.log(sleeveMeta);
        if(side === "right"){
            color = color.extract({ left: 0, top: 0, width: parseInt(sleeveMeta.width / 2) + (parseInt(sleeveMeta.width / 2) /2) > sleeveMeta.width ? sleeveMeta.width : parseInt(sleeveMeta.width / 2) + (parseInt(sleeveMeta.width / 2) /2), height: sleeveMeta.height });
        }else if(side === "left"){
            color = color.extract({ left: parseInt((sleeveMeta.width / 2) - parseInt(sleeveMeta.width / 2) / 2) > 0 ? parseInt((sleeveMeta.width / 2) - parseInt(sleeveMeta.width / 2) / 2) : 0, top: 0, width: parseInt((sleeveMeta.width / 2) + (parseInt(sleeveMeta.width / 2) / 2)), height: sleeveMeta.height });
        }
        color = color.resize( maxx - minx , null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }
    color = await color.resize( maxx - minx , maxy - miny, { fit: 'cover' });
    colorImage = await colorImage.composite([{ input: await color.toBuffer(), left: minx, top: miny, width: maxx - minx, height: maxy - miny }]).modulate({
        brightness: 1.0,   // don't globally brighten
        saturation: 1.1    // slight pop in color
    });
    await colorImage.toFile("./colorImage.png")
    //let imageMeta = await newImage.metadata();
    // //console.log(imageMeta);
    let cutout = await img.composite([{
        input: await colorImage.toBuffer(),
        blend: 'in',
        opacity: 1,
    },]);
    let final = await img.composite([{
        input: await cutout.toBuffer(),
        blend: 'darken',
        opacity: 1,
    } ]);
    await final.toFile("./final.png")
    let layerImages = []
    if(layers && layers.length > 0){
        for(let layer of layers){
            if(layer.url){
                let layerImage = await readImage(layer.url);
                layerImage.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }})
                await layerImage.toFile("./layerImage.png")
                //console.log(layer)
                if(layer.sublimated){
                    let cutout = await layerImage.composite([{
                        input: await colorImage.toBuffer(),
                        blend: 'in',
                        opacity: 1,
                    },]);
                    layerImage = await layerImage.composite([{
                        input: await cutout.toBuffer(),
                        blend: 'darken',
                        opacity: 1,
                    }]);
                    await layerImage.toFile("./layerImage.png")
                }
                layerImages.push(layerImage)                
            }
        }
    }
    await final.toFile("./final.png")
    final = await final.toBuffer()
    final = sharp(final)
    final.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    // //final = await makeBlackPixelsTransparent(await final.toBuffer())
    return {final, layerImages};
}
const createSublimationImage = async (boxs, styleImage, designImage, width) => {
   let pieceies = []
       let design = await Design.findById("6925ce3df96c30667bdf6dab");
       console.log(Object.keys(design.sublimationImages))
       for(let key of Object.keys(image.sublimationBoxes)){
           if (image.sublimationBoxes[key].layers.length > 0 && image.sublimationBoxes[key].layers[0].url){
               //console.log(key, image.sublimationBoxes[key].layers.length)
               pieceies.push(await createSide({ points: image.sublimationBoxes[key].layers[0].points, baseImage: image.sublimationBoxes[key].layers[0].url, subImage: design.sublimationImages[key], type: key.includes("Sleeve") || key.includes("sleeve") ? "sleeve" : key.includes("Hood") ? "hood" : "front", side: key.includes("Left") ? "left" : key.includes("Right") ? "right" : "center", layers: image.sublimationBoxes[key].layers.slice(1) }));
           }
       }
       await Promise.all(pieceies)
       let img = await readImage(`${image.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
       img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
       let imageMeta2 = await img.metadata();
       //console.log(imageMeta2);
       let images = []
       for (let piece of pieceies){
           images.push({ input: await piece.final.toBuffer(), blend: 'atop', x: 0, y: 0 })
           if(piece.layerImages && piece.layerImages.length > 0){
               for(let im of piece.layerImages){
                   images.push({ input: await im.toBuffer(), blend: 'atop', x: 0, y: 0 })
               }
           }
       }
       img = await img.composite(images).toBuffer();
       img = sharp(img);
       return img
}
const createImage = async (data) => {
    console.log(data, "data")
    let multiplier = 1
    let base64
    if (data.width && data.box) {
        multiplier = data.width / 400
    } else {
        data.width = 400
    }
    base64 = await readImage(`${data.styleImage?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${data.width}&height=${data.width}`)
    console.log(data.sublimationImages, "box")
    if (data.box && data.box.length > 0 && data.designImage && data.designImage != "undefined" && data.designImage != "null" && base64 != undefined) {
        let composits = []
        for(let box of data.box){
            console.log(data.designImage, "design image")
            if (data.designImage[box.side] == undefined) continue
            if (!box.boxWidth) box.boxWidth = box.width
            if (!box.boxHeight) box.boxHeight = box.height
            if (!box.containerWidth) box.containerWidth = 400
            if (!box.containerHeight) box.containerHeight = 400
            console.log(box, "box")
            let designBase64
            let x = box.x * multiplier
            let y = box.y * multiplier
            console.log(x, y, "x y")
            let originalSize
            if (box.rotation && box.rotation != 0) {
                console.log(x, y, "new x y")
                designBase64 = await readImage(`${data.designImage[box.side].replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`)
                originalSize = await designBase64.metadata();
                let originalWidth = originalSize.width;
                let originalHeight = originalSize.height;
                designBase64 = await designBase64
                    .rotate(parseInt(box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } })
                    .toBuffer();
                designBase64 = await sharp(designBase64)
                let newSize = await designBase64.metadata();
                designBase64 = await designBase64.toBuffer()
                // Convert rotation angle to radians
                const angleInRadians = (parseInt(box.rotation) * Math.PI) / 180;
                console.log(angleInRadians, "angle")
                const cosTheta = Math.cos(angleInRadians);
                const sinTheta = Math.sin(angleInRadians);
                // Calculate the center points
                const centerX = originalWidth / 2;
                const centerY = originalHeight / 2;
                console.log(centerX, centerY, cosTheta, sinTheta, "center")
                // Calculate how much the top-left corner moved during rotation around center
                const rotatedTopLeftX =
                    centerX + ((0 - centerX) * cosTheta) - ((0 - centerY) * sinTheta);
                const rotatedTopLeftY =
                    centerY + ((0 - centerX) * sinTheta) + ((0 - centerY) * cosTheta);
                // Adjust the position to compensate for the rotation
                let offsetH = (newSize.height - originalHeight) / 2
                let offsetW = (newSize.width - originalWidth) / 2
                console.log(rotatedTopLeftX, rotatedTopLeftY, offsetH, offsetW, "rotated top left")
                x -= (rotatedTopLeftX + offsetW);
                y -= (rotatedTopLeftY + offsetH);
                console.log(x, y, "new x y")
            } else {

                designBase64 = await readImage(`${data.designImage[box.side]?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`)
                originalSize = await designBase64.metadata();
                designBase64 = await designBase64.toBuffer()
            }
            let offset = (originalSize.width - (box.boxWidth * multiplier)) / 2
            console.log(x, y, offset, "x y offset")
            composits.push( {
                input: designBase64,
                blend: 'atop',
                top: parseInt(y),
                left: parseInt(x - offset),
                gravity: "center",
            })
        }
        base64 = await base64.composite(composits)
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    } else if (data.styleImage && base64) {
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    } else if (data.designImage && data.designImage != "undefined" && data.designImage != "null") {
        base64 = await readImage(`${data.designImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(data.width)}&height=${parseInt(data.width)}`)
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    }
    return base64
}
export async function GET(req){
    let base = req.url.split("/")[req.url.split("/").length - 1].split(".")[0].replace(/%20/g, " ")
    let params = base.split("-")
    let width = parseInt(req.nextUrl.searchParams.get("width"))
    let designImage
    let blankImage
    let type
    let sides = params && params[4]? params[4].split("_") : []
    let design
    console.log(params.length, "params")
    if (params.length == 5) {
        design = await Design.findOne({ sku: params[0] }).select("images sublimationImages").lean()
        designImage = design?.images
        let blank = await Blank.findOne({ code: params[1].replace(/_/g, "-") }).populate("colors").lean()
        if(blank && blank.multiImages)blankImage = blank?.multiImages[params[4]]?.filter(i => i.image.includes(params[2]))[0]
        if (blankImage == undefined && blank && blank.multiImages) {
            blankImage = blank?.multiImages[params[4] == "front"? "modelFront" : "modelBack"]?.filter(i => i.image.includes(params[2]))[0]
        }
        if(blankImage == undefined){
            blankImage = blank?.images?.filter(i => i.image.includes(params[2]))[0]
            type = "images"
        }
    } else if (params.length == 6) {
        design = await Design.findOne({ sku: params[0] }).lean()
        designImage = design?.threadImages?.[params[5]]
        let blank = await Blank.findOne({ code: params[1] }).populate("colors").lean()
        blankImage = blank.multiImages[params[4]]?.filter(i => i.image.includes(params[2]))[0]
        if (blankImage == undefined) {
            blankImage = blank?.multiImages[params[4] == "front" ? "modelFront" : "modelBack"]?.filter(i => i.image.includes(params[2]))[0]
        }
        if (blankImage == undefined) {
            blankImage = blank?.images?.filter(i => i.image.includes(params[2]))[0]
            type = "images"
        }
    } else {
        let blankCode = req.nextUrl.searchParams.get("blank")
        let bm = req.nextUrl.searchParams.get("blankImage")
        let colorName = req.nextUrl.searchParams.get("colorName")
        designImage = req.nextUrl.searchParams.get("design")
        let side = req.nextUrl.searchParams.get("side")
        if(side != undefined) {
            sides.push(side)
            designImage = { [side]: designImage }
        }
        let blank = await Blank.findOne({ code: blankCode }).populate("colors").lean()
        let color = blank.colors.filter(c => c.name == colorName)[0]
        if(bm && blank.images && blank.images.length > 0){
            type = "images"
            blankImage = blank.images.filter(i => i.image == bm)[0]
        }
        else if (bm) {
            blankImage = blank.multiImages[side]?.filter(i => i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if (!blankImage && side == "front") blankImage = blank.multiImages["modelFront"]?.filter(i => i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if (!blankImage && side == "back") blankImage = blank.multiImages["modelBack"]?.filter(i => i.color.toString() == color?._id.toString() && i.image == bm)[0]
        }else if(blank.images && blank.images.length > 0) {
            type = "images"
            blankImage = blank.images.filter(i => i.color.toString() == color?._id.toString() && i.boxes[side])[0]
        }else blankImage = blank.multiImages[side]?.filter(i => i.color.toString() == color?._id.toString())[0]
        if (side == "back" && blankImage == undefined) {
            blankImage = blank.multiImages["modelBack"]?.filter(i => i.color.toString() == color?._id.toString())[0]
        }
    }
    if(type == "images") console.log(blankImage.boxes["front"], "boxes")
    console.log(designImage[sides[0]], "images")
    let data = {box: type == "images"? Object.keys(blankImage?.boxes? blankImage.boxes: {}).filter(key=> sides.includes(key)).map(key => {return {...blankImage.boxes[key], side: key}}):  blankImage?.box? [{...blankImage?.box[0], side: sides[0]}]: null, styleImage: blankImage?.image, designImage, sublimationImages: design.sublimationImages? design.sublimationImages: null, sublimationBoxes: blankImage.sublimationBoxes? blankImage.sublimationBoxes: null, width}
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
    let base64 = await createImage(data)
    return NextResponse.json({error: false, base64})
}