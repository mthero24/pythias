import express from "express";
import bodyParser from "body-parser";
import sharp from "sharp";
import axios from "axios";
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
    );
    const buffer = Buffer.from(response.data, "binary");

    // Use sharp to process the image
    let image = sharp(buffer);
    return image
}
app.get('/images',  async(req, res) => {
    let data = req.query
    console.log(data)
    let base64
    if(data.box && data.designImage){
        data.box = JSON.parse(data.box)
        base64 = await readImage(data.styleImage)
        base64 = base64.resize({
            width: data.box.containerWidth,
            height: data.box.containerHeight,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        let designBase64 = await readImage(data.designImage)
        designBase64 = designBase64.trim()
        designBase64 = await designBase64.resize({
            width: parseInt(data.box.boxWidth),
            height: parseInt(data.box.boxHeight),
            background: {r: 0, g: 0, b: 0, alpha: 0},
            fit: sharp.fit.contain,
            position: sharp.strategy.attention,
            fastShrinkOnLoad: false 
        })
        designBase64 = await designBase64.toBuffer();
        base64 = await base64.composite([
            {
                input: designBase64,
                blend: 'atop',
                gravity: "northeast",
                top: parseInt(data.box.y),
                left: parseInt(data.box.x),
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
    console.log(base64)
    res.send({base64})
});
  
app.listen(3008, () => {
    console.log('Server listening on port 3008');
  });