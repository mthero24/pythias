import sharp from "sharp"
import {NextApiRequest, NextResponse} from "next/server"
import axios from "axios"
import "jimp"
const readImage = async (url)=>{
    console.log(url)
    const response = await axios.get(
      url,
      { responseType: "arraybuffer" }
    );
    console.log(response.headers)
    const buffer = Buffer.from(response.data, "binary");

    // Use sharp to process the image
    let image = sharp(buffer);
    return image
}

export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let base64
    if(data.box && data.designImage){
        base64 = await readImage(data.styleImage)
        base64 = base64.resize({
            width: data.box.containerWidth + 300,
            height: data.box.containerHeight + 300,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        let designBase64 = await readImage(data.designImage)
        designBase64 = designBase64.trim()
        designBase64 = await designBase64.resize({
            width: parseInt(data.box.boxWidth * 1.75),
            height: parseInt(data.box.boxHeight * 1.75),
            background: {r: 0, g: 0, b: 0, alpha: 0},
            fit: sharp.fit.inside,
            position: sharp.strategy.attention,
            fastShrinkOnLoad: false 
        })
        designBase64 = await designBase64.toBuffer();
        base64 = await base64.composite([
            {
                input: designBase64,
                blend: 'atop',
                top: parseInt(data.box.y * 1.75),
                left: parseInt(data.box.x * 1.75),
                gravity: "center",
            },

        ]).png({ quality: 95 })
        .toBuffer();
        base64 = `data:image/png;base64,${base64.toString("base64")}`
    }else{
        base64 = await readImage(data.styleImage)
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
    //console.log(base64)
    return NextResponse.json({error: false, base64})
}