import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";
import fs from "fs"
import axios from "axios"
export const createPdf = async ({items, buildLabelData, localIP, key })=>{
    let labelsString = ``
    let doc = new PDFDocument({ size: [2 * 72, 2 * 72], margin: 0 });
    let stream = doc.pipe(new Base64Encode());
    stream.on('data', function(chunk) {
        labelsString += chunk;
    });
    let j = 0
    console.log(items.length)
     for(let i of items){
        if(j!=0) doc.addPage({ size: [2 * 72, 2* 72], margin: 0  })
        await buildLabelData(i, j, doc)
        j++
    }
    doc.end()
    stream.on('end', async function() {
        let headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            }
        }
        console.log(headers, localIP)
        let res = await axios.post(`http://10.1.10.106:3005/api/print-labels-pdf`, {label: labelsString, printer: "printer1", barcode: "label"}, headers).catch(e=>{console.log(e, "error")})
        console.log(res?.data, "res")
    }); 
}