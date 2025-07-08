import sharp from "sharp"
import PDFDocument from "pdfkit";
import { getConfig } from "../config";
import axios from "axios";
import concat from "concat-stream";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const convertInchesToPixels = (inches) => {
  return inches * PPI;
};
const readImage = async (url)=>{
    console.log(url)
    const response = await axios.get(
      url.replace(
        "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev/",
        "http://images2.tshirtpalace.com/"
      ).replace(
            "s3.wasabisys.com/images2.tshirtpalace.com/",
            "images2.tshirtpalace.com/"
            ),
      { responseType: "arraybuffer" }
    );
    const buffer = Buffer.from(response.data, "binary");

    // Use sharp to process the image
    let image = sharp(buffer);
    return image
}
export const createMug = async (item) => {
    try{
        let res = await new Promise(async (resolve)=>{
            let config = getConfig();
            console.log("createMug()", config);
            let widthInches;
            let heightInches;
            if (item.sizeName == "11 oz" || item.sizeName == "12 oz") {
            widthInches = 3.5;
            heightInches = 9.125;
            } else {
            widthInches = 4;
            heightInches = 9.5;
            }
            console.log(widthInches, heightInches);
            // Create a new PDF document with the specified size
            let doc = new PDFDocument({ size: [widthInches * 72, heightInches * 72] });

            const PPI = 300;
            // Calculate the dimensions for each half of the paper
            const halfHeight = (heightInches * PPI) / 2;
            const fullWidth = widthInches * PPI;

            // Load the front image
            let front;
            // Load the back image, or use the front image if no back URL is provided
            let back;
            front = await readImage(
                item.design.front
            );
            back = item.design.back ? await readImage(item.design.back): front;

            

            let marginY = halfHeight * 0.4;
            let marginX = fullWidth * 0.2;
            
            // Resize the front image to fit within half of the paper
            front = await front.resize({
            width: parseInt(halfHeight - marginY),
            height: parseInt(fullWidth - marginX),
            fit: sharp.fit.contain,
            position: sharp.strategy.entropy,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
            });
            // Resize the back image to fit within half of the paper
            back = await back.resize({
            width: parseInt(halfHeight - marginY),
            height: parseInt(fullWidth - marginX),
            fit: sharp.fit.contain,
            position: sharp.strategy.entropy,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
            });
            // Rotate the images 90 degrees to the left
            front = await front.flip().rotate(90).toBuffer();
            back = await back.flip().rotate(90).toBuffer();

            // Create a composite image with the front and back images one on top of the other
            
            let composite = await sharp({
                create: {
                width: parseInt(widthInches * PPI),
                height: parseInt(heightInches * PPI),
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
                },
            });
            composite = await composite
            .composite([
            {
                input: front,
                top: parseInt(marginY / 2),
                left: parseInt(marginX / 2),
            },
            {
                input: back,
                top: parseInt(halfHeight + marginY / 2),
                left: parseInt(marginX / 2),
            },
            ])
            .png({ quality: 95 })
            .toBuffer();
            //console.log("mirror")
            // Convert the composite image to a base64 string
            let trimmedBase64 = `data:image/png;base64,${composite.toString("base64")}`;
            //console.log(trimmedBase64);
            // Write the composite image to the PDF document
            doc.image(trimmedBase64, 0, 0, {
                width: doc.page.width,
                height: doc.page.height,
            });

            // Add SKU and other details to the PDF
            console.log(__dirname);
            doc
            .font(
                __dirname + "/public/fonts/LibreBarcode128-Regular.ttf"
            )
            .fontSize(25)
            .text(`*${item.pieceId}*`, 20, 8);
            doc
                .font("Times-Roman")
                .fontSize(8)
                .text(
                `${item.pieceId} ${item.styleCode} ${item.colorName} ${item.sizeName} ${item.shippingType} ${item.order.items.length}`,
                20,
                24
            );

            // Save the PDF document
            doc.pipe(
                concat(async function (buffer) {
                    const base64String = buffer.toString("base64");
                    //console.log(base64String);
                    let headers = {
                        headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${config.localKey}`,
                        },
                    };
                    let folder;
                    if (item.sizeName == "11 oz" || item.sizeName == "12 oz") {
                        folder = "11 oz";
                    } else {
                        folder = "15 oz";
                    }
                    let res = await axios.post(
                    `http://${config.localIP}/api/sublimation`,
                    {
                        base64: base64String,
                        type: "pdf",
                        folder,
                        pieceId: item.pieceId,
                        printer: "printer1",
                    },
                    headers
                    );
                    resolve(res)
                })
            );
            doc.end();
        })
        console.log(res);
        return res
    }catch(e){
        console.log(e)
        return {error: true, msg: JSON.stringify(e)}
    }
};
