import axios from "axios";
import btoa from "btoa"

export async function sendFile({url,pieceID,printer,key, localIP}){
    console.log(url)
    const response = await axios.get(url,{ responseType: "arraybuffer" });
    console.log(response.headers)
    console.log(response.data)
    const buffer = Buffer.from(response.data, "binary");
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$JZrqzFlmXbhUOy92szsDkejVy6xoYm48hPJP2VhYtMeOBNyM7o8pm`
        }
    }
    let res = await axios.post(`http://localhost:3005/api/embroidery`, {files: [{buffer: buffer, type: url.split(".")[url.split(".").length - 1]}], printer, sku: pieceID}, headers).catch(e=>{resData = e.response.data})
    if(res?.data) return res.data
    else return resData
}