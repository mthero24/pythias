import axios from "axios";
import btoa from "btoa"

export async function sendFile({url,pieceID,printer,key, localIP}){
    console.log(url)
    const response = await axios.get(url,{ responseType: "arraybuffer" });
    console.log(response.headers)
    const buffer = Buffer.from(response.data, "binary");
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        }
    }
    let res = await axios.post(`http://${localIP}/api/embroidery`, {files: [{buffer: buffer, type: url.split(".")[1]}], printer, sku: pieceID}, headers).catch(e=>{resData = e.response.data})
    if(res?.data) return res.data
    else return resData
}