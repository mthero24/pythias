import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Item, Inventory} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import {refreshToken} from "@pythias/integrations"
import {getProductInfoByStyleColorSize, getProductInfoByBrand} from "@pythias/inventory"
import { FromSanmarBlank } from "@pythias/backend"
import sharp from "sharp";
const readImage = async (url) => {
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
const createSide = async ({boxes, baseImage, subImage}) => {
    boxes = boxes.filter(box => box.x > 0 && box.y > 0);
    let img = await readImage(`${baseImage.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
    img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    let extractions = []
    let minx = parseInt(boxes.reduce((min, box) => box.x < min ? box.x : min, Infinity));
    let miny = parseInt(boxes.reduce((min, box) => box.y < min ? box.y : min, Infinity));
    let maxx = parseInt(boxes.reduce((max, box) => (box.x + box.width) > max ? (box.x + box.width) : max, -Infinity));
    let maxy = parseInt(boxes.reduce((max, box) => (box.y + box.height) > max ? (box.y + box.height) : max, -Infinity)) > 400 ? 400 : parseInt(boxes.reduce((max, box) => (box.y + box.height) > max ? (box.y + box.height) : max, -Infinity));
    console.log({ minx, miny, maxx, maxy })
    for (let box of boxes) {
       // console.log(parseInt(box.height), parseInt(box.width), parseInt(box.x), parseInt(box.y))
        try {
            let extractor = img.extract({ left: parseInt(box.x), top: parseInt(box.y), width: parseInt(box.width), height: parseInt(box.height > 400 ? 400 : box.height) })
            extractions.push({
                input: await extractor.toBuffer(),
                top: parseInt(box.y),
                left: parseInt(box.x),
                width: parseInt(box.width),
                height: parseInt(box.height),
            })
        } catch (e) {
            console.log("extraction error", e)
        }
    }
    let newImage = sharp({
        create: {
            width: 400,
            height: 400,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    }).png();
    let neg = sharp({
        create: {
            width: 400,
            height: 400,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    }).png();
    let colorImage = sharp({
        create: {
            width: 400,
            height: 400,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).png();
    newImage = await newImage.composite(extractions).trim().sharpen({ sigma: 10, flat: 1, jagged: 2 });
    neg = await neg.composite(extractions).trim().sharpen({ sigma: 10, flat: 1, jagged: 2 });
   newImage = await newImage.composite([{ input: await newImage.toBuffer(), blend: 'lighten' }]).sharpen({ sigma: 10, flat: 1, jagged: 2 }).toBuffer();
    newImage = sharp(newImage)
    newImage = newImage.greyscale();
    let negative = await neg.greyscale().threshold(255, {greyscale: true}).sharpen({ sigma: 10, flat: 1, jagged: 2 });
    await negative.toFile("./negative.png");
    await newImage.toFile("./output.png")
    let color = await sharp(subImage);
    color = await color.resize(maxx - minx, maxy - miny, { fit: 'cover' });
    colorImage = await colorImage.composite([{ input: await color.toBuffer(), left: minx, top: miny, width: maxx - minx, height: maxy - miny }]);
    let imageMeta = await newImage.metadata();
    console.log(imageMeta);

    let final = await newImage.composite([{ input: await colorImage.toBuffer(), blend: 'color-burn' }, { input: await negative.toBuffer(), blend: 'color-burn' }, { input: await colorImage.toBuffer(), blend: 'color-burn' },]);
    final = final.clahe({width: 50, height: 50, maxSlope: 5}).normalize({lower: 0, upper: 100});
    //final = await final.composite([{ input: await colorImage, blend: 'overlay' }])
    await final.toFile("./final.png")
    final = await final.toBuffer()
    final = sharp(final)
    final.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    extractions = []
    for (let box of boxes) {
        try {
            let extractor = final.extract({ left: parseInt(box.x), top: parseInt(box.y), width: parseInt(box.width), height: parseInt(box.height) })
            extractions.push({
                input: await extractor.toBuffer(),
                top: parseInt(box.y),
                left: parseInt(box.x),
                width: parseInt(box.width),
                height: parseInt(box.height),
            })
        } catch (e) {
            console.log("extraction error", e)
        }
    }
    let transparentImage = sharp({
        create: {
            width: 400,
            height: 400,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).png();
    transparentImage = await transparentImage.composite(extractions).trim().normalise({lower: 0, upper: 100}).toBuffer();
    return transparentImage = sharp(transparentImage)
}
export default async function Test(){
    let blank =  await Blank.findOne({code: "C"}).lean();
    let image = blank.images.find(img=> img.sublimationBoxes && Object.keys(img.sublimationBoxes).length > 0 && img.sublimationBoxes["front"] && img.sublimationBoxes["front"].length > 0);
    console.log(image);
    console.log(image.sublimationBoxes["front"][0])
    
    let frontImage = await createSide({ boxes: image.sublimationBoxes["front"], baseImage: image.image, subImage: "./abstract.jpg" });
    let leftSleeveImage = await createSide({ boxes: image.sublimationBoxes["leftSleeve"], baseImage: image.image, subImage: "./abstract.jpg" });
    let rightSleeveImage = await createSide({ boxes: image.sublimationBoxes["rightSleeve"], baseImage: image.image, subImage: "./abstract.jpg" });
    let img = await readImage(`${image.image.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=400&height=400`);
    img = img.resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    let imageMeta2 = await img.metadata();
    console.log(imageMeta2);
    img = await img.composite([{ input: await frontImage.toBuffer(), blend: 'atop', x: 0, y: 0 }, { input: await leftSleeveImage.toBuffer(), blend: 'atop', x: 0, y: 0 }, { input: await rightSleeveImage.toBuffer(), blend: 'atop', x: 0, y: 0 } ]).toBuffer();
    img = sharp(img);
    img.resize(1200,1200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    await img.toFile("./combined2.png");
    return <FromSanmarBlank />
    //("https://images1.pythiastechnologies.com/styles/1742087292890.png")
}