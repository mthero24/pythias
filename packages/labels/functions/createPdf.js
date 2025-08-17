import PDFDocument from "pdfkit";
import { Base64Encode } from "base64-stream";
import axios from "axios"
export const createPdf = async ({items, buildLabelData, localIP, key, lastIndex, type, poNumber })=>{
    let labelsString = ``
    let doc = new PDFDocument({ size: [2 * 72, 2 * 72], margin: 0 });
    let stream = doc.pipe(new Base64Encode());
    stream.on('data', function(chunk) {
        labelsString += chunk;
    });
    let j = 0
    let printed = false
    for(let i of items){
       // console.log(lastIndex && j >= lastIndex)
        if(lastIndex && j >= lastIndex){
            if(j != 0) doc.addPage({ size: [2 * 72, 2* 72], margin: 0  })
           await buildLabelData(i, j, doc, type, poNumber )
        }else if(!lastIndex){
            if(j != 0) doc.addPage({ size: [2 * 72, 2* 72], margin: 0  })
            await buildLabelData(i, j, doc, type, poNumber)
        }
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
        let res = await axios.post(`http://${localIP}/api/print-labels-pdf`, {label: labelsString, printer: "printer1", barcode: "label"}, headers).catch(e=>{console.log(e, "error")})
        console.log(res?.data, "res")
    }); 
}