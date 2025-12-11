import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Item, Inventory} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import {refreshToken} from "@pythias/integrations"
import {getProductInfoByStyleColorSize, getProductInfoByBrand} from "@pythias/inventory"
import { FromSanmarBlank } from "@pythias/backend"
import sharp from "sharp";
import { layer } from "@fortawesome/fontawesome-svg-core";
import { base } from "@/models/PrintPricing";
import { SublimationImages, serialize } from "@pythias/backend"
const readImage = async (url) => {
    //console.log(url, "read image")
    const response = await axios.get(
        url,
        { responseType: "arraybuffer" }
    ).catch(e => { });
    if (response) {
        const buffer = Buffer.from(response.data, "binary");
        // Use sharp to process the image
        let image = sharp(buffer);
        return image
    }
    return null
}


async function makeBlackPixelsTransparent(inputPath) {
    try {
        const { data, info } = await sharp(inputPath)
            .ensureAlpha() // Ensure the image has an alpha channel
            .raw()
            .toBuffer({ resolveWithObject: true });

        const { width, height, channels } = info;
        const pixelData = new Uint8ClampedArray(data); // Use Uint8ClampedArray for pixel manipulation

        for (let i = 0; i < pixelData.length; i += channels) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            const a = pixelData[i + 3];
            //console.log(`Pixel RGBA: (${r}, ${g}, ${b}, ${a})`);
            // Check if the pixel is pure black (0,0,0)
            if (r === 0 && g === 0 && b === 0) {
                // Set alpha to 0 for transparency
                pixelData[i + 3] = 0;
            }
        }

        let final =await sharp(pixelData, { raw: { width, height, channels } }).png()
        const outputPath = 'output-transparent.png';
        await final.toFile(outputPath);
        return sharp(await final.toBuffer());

        console.log(`Image processed and saved to ${outputPath}`);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}


const createSide = async ({points, baseImage, subImage, type, side, layers}) => {
    //console.log("Creating side:", type, side, subImage, baseImage)
    let img = await readImage(`${baseImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
    img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    await img.toFile("./baseImage.png")
    img = await makeBlackPixelsTransparent( await img.toBuffer());
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
export default async function Test(){
//     let blank =  await Blank.findOne({code: "HOOD"});
    
//     let image = blank.images.find(img => img.sublimationBoxes);
//     //console.log(image);
//     // //console.log(Object.keys(image.sublimationBoxes));
//     // //console.log(image.sublimationBoxes.rightUperSleeve.layers[0].boxes);
//     // //let backgroundImage = await createSide({ boxes: image.sublimationBoxes["background"].layers[0].boxes, baseImage: image.image, subImage: "./abstract.jpg" });
//     let pieceies = []
//     let design = await Design.findById("6925ce3df96c30667bdf6dab");
//     console.log(Object.keys(design.sublimationImages))
//     for(let key of Object.keys(image.sublimationBoxes)){
//         if (image.sublimationBoxes[key].layers.length > 0 && image.sublimationBoxes[key].layers[0].url){
//             //console.log(key, image.sublimationBoxes[key].layers.length)
//             pieceies.push(await createSide({ points: image.sublimationBoxes[key].layers[0].points, baseImage: image.sublimationBoxes[key].layers[0].url, subImage: design.sublimationImages[key], type: key.includes("Sleeve") || key.includes("sleeve") ? "sleeve" : key.includes("Hood") ? "hood" : "front", side: key.includes("Left") ? "left" : key.includes("Right") ? "right" : "center", layers: image.sublimationBoxes[key].layers.slice(1) }));
//         }
//     }
//     await Promise.all(pieceies)
//     let img = await readImage(`${image.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
//     img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
//     let imageMeta2 = await img.metadata();
//     //console.log(imageMeta2);
//     let images = []
//     for (let piece of pieceies){
//         images.push({ input: await piece.final.toBuffer(), blend: 'atop', x: 0, y: 0 })
//         if(piece.layerImages && piece.layerImages.length > 0){
//             for(let im of piece.layerImages){
//                 images.push({ input: await im.toBuffer(), blend: 'atop', x: 0, y: 0 })
//             }
//         }
//     }
//     img = await img.composite(images).toBuffer();
//     img = sharp(img);
//     img.resize(1200, 1200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
//    // await img.toFile("./combined2.png");
//     // design = await Design.findById("6925ce3df96c30667bdf6dab").lean();
//     // console.log(design)
    return <h1>test</h1>
    //("https://images1.pythiastechnologies.com/styles/1742087292890.png")
}