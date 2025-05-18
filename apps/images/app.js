import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import sharp from "sharp";
import axios from "axios";
import Blanks from './models/Blanks.js';
const app = express();

app.use(
    bodyParser.urlencoded({
        limit: "1000000gb",
        parameterLimit: 1000000000000,
        extended: true,
    })
)
app.use(bodyParser.json({ limit: "1000000gb" }));

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
    let multiplier = 1
    let base64
    if(data.width && data.box){
        multiplier = data.width / data.box.containerWidth
    }else{
        data.width = 400
    }
    base64 = await readImage(data.styleImage)
    console.log(data)
    if(data.box && data.designImage && data.designImage != "undefined" && base64){
        base64 = base64.resize({
            width: data.width,
            height: data.width,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy,
            background: {r: 255, g: 255, b: 255, alpha: 1},
        })
        
        let designBase64 = await readImage(data.designImage)
        designBase64 = designBase64?.trim()
        let x = data.box.x * multiplier
        let y = data.box.y * multiplier
        let originalSize
        if(data.box.rotation && data.box.rotation != 0){
            console.log(data.box.rotation, "rotation")
            designBase64 = await designBase64.resize({
                width: parseInt(data.box.boxWidth * multiplier),
                height: parseInt(data.box.boxHeight * multiplier) ,
                background: {r: 255, g: 255, b: 255, alpha: 0},
                fit: sharp.fit.inside,
                position: "left top",
                fastShrinkOnLoad: false 
            }).toBuffer()
            designBase64 = await sharp(designBase64)
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
            designBase64 = await designBase64.resize({
                width: parseInt(data.box.boxWidth * multiplier ),
                height: parseInt(data.box.boxHeight * multiplier),
                background: {r: 255, g: 255, b: 255, alpha: 0},
                fit: sharp.fit.inside,
                position: sharp.strategy.attention,
                fastShrinkOnLoad: false 
            }).toBuffer()
            designBase64 = await sharp(designBase64)
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
        base64 = base64.resize({
            width: data.width,
            height: data.width,
            fit: sharp.fit.inside,
            position: sharp.strategy.entropy
        })
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        //console.log(base64, "base64")
        base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
    }else if(data.designImage){
        base64 = await readImage(data.designImage)
        if(base64){
            base64 = base64.resize({
                width: data.width,
                height: data.width,
                fit: sharp.fit.inside,
                position: sharp.strategy.entropy
            })
            base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
            //console.log(base64, "base64")
            base64 = `data:image/jpeg;base64,${base64.toString("base64")}`
        }
    }
    return base64
}

app.get("/*", async (req, res)=>{
    console.log(req.query)
    let blankCode = req.query.blank
    let bm = req.query.blankImage
    let colorName = req.query.colorName
    let designImage = req.query.design
    let side = req.query.side
    let width = parseInt(req.query.width)
    console.log(blankCode, bm, colorName, designImage, side)
    let blank = await Blanks.findOne({code: blankCode}).populate("colors").lean()
    res.set('Content-Type', 'image/jpeg');
    res.header('Access-Control-Allow-Origin', '*');
    if(blank){
        let color = blank.colors.filter(c=>c.name == colorName)[0]
        console.log(color)
        let blankImage
        if(bm){
            blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if(!blankImage && side == "front") blankImage = blank.multiImages["modelFront"]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
            if(!blankImage && side == "back") blankImage = blank.multiImages["modelBack"]?.filter(i=> i.color.toString() == color?._id.toString() && i.image == bm)[0]
        }
        else blankImage = blank.multiImages[side]?.filter(i=> i.color.toString() == color?._id.toString())[0]
        if(side == "back" && blankImage == undefined){
            blankImage = blank.multiImages["modelBack"]?.filter(i=> i.color.toString() == color?._id.toString())[0]
        }
        //console.log(blankImage?.box[0], "box")
        let data = {box: blankImage?.box[0]? blankImage?.box[0]: null, styleImage: blankImage?.image, designImage, width}
        let base64 = await createImage(data)
        if(base64){
            base64 = base64.replace(/^data:image\/\w+;base64,/, "")
            let buffer = new Buffer.from(base64, "base64")
            return res.status(200).send(buffer)
        }
        // console.log("no base64")
        // res.status(500).send()
    }
    console.log("no blank")
    res.status(500).send()
})

app.listen(3010, () => {
    console.log('Server listening on port 3010');
  });
