import 'dotenv/config'
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
    ).catch(e=>{console.log(e.response)});
    //console.log(response.headers)
    console.log(response.data)
    if(response){
        const buffer = Buffer.from(response.data, "binary");

        // Use sharp to process the image
        let image = sharp(buffer);
        return image
    }
    return null
}

app.get("/origin/*", async (req, res) => {
    console.log(req.originalUrl)
    console.log(req.originalUrl.replace("/origin", ""))
    console.log(req.query)
    let image = await readImage(`https://images1.pythiastechnologies.com${req.originalUrl.replace("/origin", "")}`);
    if(req.query.width || req.query.height){
        image = await image.resize({
            width: req.query.width ? parseInt(req.query.width) : parseInt(req.query.height),
            height: req.query.height ? parseInt(req.query.height) : parseInt(req.query.width),
            background: { r: 255, g: 255, b: 255, alpha: 0 },
            fit: sharp.fit.inside,
            position: sharp.strategy.attention,
            fastShrinkOnLoad: false
        })
        if(req.headers['accept'] && req.headers['accept'].includes("webp")){
            image = await image.webp({ lossless: true, quality: 90, alphaQuality: 90 }).toBuffer()
        }else{
            image = await image.jpeg({ quality: 90 }).toBuffer()
        }
    }else{
        if (req.headers['accept'] && req.headers['accept'].includes("webp")) {
            image = await image.webp({ lossless: true, quality: 90, alphaQuality: 90 }).toBuffer()
        } else {
            image = await image.jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer()
        }
    }
    res.set('Content-Type', req.headers['accept'] && req.headers['accept'].includes("webp")? "image/webp": 'image/jpeg');
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(200).send(image)
})

app.get("/*", async (req, res)=>{
    return res.status(200)
})

app.listen(3011, () => {
    console.log('Server listening on port 3010');
  });
