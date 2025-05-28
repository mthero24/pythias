import axios from "axios";
import {Config} from "../config";
import sharp from "sharp"
const changeDPI = require("changedpi");
let fitDesignStyleCodes = [
  "3346",
  "229534",
  "SKULLY",
  "112FP",
  "256",
  "112PFP",
  "POST",
  "CFM",
  "TH",
  "LTB",
  "MSP",
  "DSB",
  "TMUG",
  "BTN",
  "MGN",
  "BST",
  "CST",
  "AWB",
  "SSB",
  "SLT",
  "FBTH",
  "DNAH",
  "YPWH",
  "OFTH",
  "KLCB",
  "CKBL",
  "YPKCB",
  "PURB",
  "SPTB",
  "BGCB",
  "BGSCP",
  "ZTB",
  "TOBH",
  "SPPKB",
  "PAVBP",
  "LBBBP",
  "ZUHD",
  "BKHT",
  "CANV",
  "CS1000",
  "VC500",
  "CFB",
  "GD64800",
  "ZION",
  "GB493",
  "3124P",
  "FIJI",
  "STC45",
  "BUMP",
  "BG222",
  "BG225",
  "BG226",
  "STAHAT",
  "STC31",
  "C964",
  "C962",
  "JST58",
  "RKF12",
  "6017",
  "HOLLY",
  "STC28",
  "EXP550Z",
  "BYEH300W",
  "3905",
  "168",
  "500",
  "100",
  "153",
  "21672",
  "21230",
  "23502",
  "130",
  "A230",
  "A324",
  "054X",
  "GB400",
  "SP450",
  "8110",
  "712",
  "CSV60",
  "F906",
  "A702",
  "21150",
  "ST640",
  "K572",
  "S1505",
  "X210P",
  "5511UP",
  "DTFTFR",
  "A574",
  "PRINTONLY",
  "BG427",
  "L535",
  "112PM",
  "Q600",
  "MMB600",
  "4001",
  "A595",
  "J317",
  "TRU35CG",
  "MW40CG",
  "TW540",
  "TW51",
  "2300",
  "141",
  "142",
  "39165",
  "88181",
  "CE002",
  "SY42",
];
async function getMetaData(base64) {
  // Remove the base64 prefix if it exists
  // const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  // const buffer = Buffer.from(base64Data, "base64");

  // // Use sharp to get image metadata
  // const metadata = await sharp(buffer).metadata();
  return {}
}
export const createImage = async (
   { url,
    size,
    sku,
    style,
    pieceID,
    shouldFitDesign = false,
    printer,
    localKey
  }
  ) => {
    console.log("create Image");
    console.log(url);
  
    // Download the image
  //   const response = await axios.get(
  //     url.replace(
  //       "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev/",
  //       "http://images2.teeshirtpalace.com/"
  //     ),
  //     { responseType: "arraybuffer" }
  //   );
  //   const buffer = Buffer.from(response.data, "binary");
  
  //   // Use sharp to process the image
  //   let image = sharp(buffer);
  
  //   // Trim the transparent pixels
  //   image = image.trim();
  
  //   let trimmedBase64 = await image.png({ quality: 95 }).toBuffer();
  //   trimmedBase64 = `data:image/png;base64,${trimmedBase64.toString("base64")}`;
  //   let metadata = await getMetaData(trimmedBase64);
  //   // Get metadata to calculate PPI
  //   const widthInches = parseInt(size.split("x")[0]);
  //   const heightInches = parseFloat(size.split("x")[1]);
  //   console.log(
  //     metadata.width,
  //     metadata.height,
  //     "width & height of image in pixels"
  //   );
  //   console.log(widthInches, heightInches, "width & height of image in inches");
  
  //   let wPPI = metadata.width / widthInches;
  //   let hPPI = metadata.height / heightInches;
  
  //   if (fitDesignStyleCodes.includes(style) || shouldFitDesign) {
  //     console.log("fitting design for style: ", style);
  //     wPPI = metadata.width / widthInches;
  //     hPPI = metadata.height / heightInches;
  //   }
  //   const PPI = parseInt(Math.max(wPPI, hPPI));
  
  //   console.log(parseInt(PPI), "PPI", metadata.width / PPI);
  //   // Resize the image to the desired DPI
  
  //   const resizedImage = await image.png({ quality: 10 }).toBuffer();
  //   let base64 = `data:image/png;base64,${resizedImage.toString("base64")}`;
  //   base64 = await changeDPI.changeDpiDataUrl(base64, PPI);
  //   // Save the image
  
  //   const data = base64.replace(/^data:image\/\w+;base64,/, "");

  //   let finalBuffer = Buffer.from(data, "base64");
  //   let finalImage = sharp(finalBuffer);
  //   let finalMetaData = await finalImage.metadata();
  //   console.log(finalMetaData.width / finalMetaData.density, "W inches");
  //   console.log(finalMetaData.height / finalMetaData.density, "H inches");
  
  //   //convert bytes to KB
  //   const sizeInKB = finalMetaData.size / 1024;
  //   console.log(`Size: ${sizeInKB.toFixed(2)} KB`);
  //   let resData
  //   console.log(Config.internalIP)
    
  //   let headers = {
  //     headers: {
  //         "Content-Type": "application/json",
  //         "Authorization": `Bearer ${Config.apiKey}`
  //     }
  // }
  // console.log(Config, printer)
  //   let res = await axios.post(`http://${Config.internalIP}/api/dtf`, {files: [{buffer: finalBuffer, type: "png"}], printer, sku: pieceID}, headers).catch(e=>{resData = e.response.data})
  //   if(res?.data) return res.data
  //   else return resData
  return {error: false}
  };