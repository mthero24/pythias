import fs from "fs"
import axios from "axios"
export default async function Test(){
    let res = {error: false}
    let label = await fs.readFileSync("programming.txt", {encoding: 'utf8',})
    //console.log(label)
    let id = label.split("Content-Type")[0].trim();
    let ar = label.split(id)
    console.log(ar[1])
    let metaData = JSON.parse(ar[1].split('labelMetadata"')[1].trim())
    res.cost = metaData.postage
    res.trackingNumber = metaData.trackingNumber
    console.log(res)
    console.log(ar[2])
    res.label = ar[2].split('labelImage"')[1].trim()
    console.log(res)
    let print = await axios.post("http://localhost:3004/api/production/shipping/labels/reprint", {label: res.label, station: "station5", type: "pdf"})
    console.log(print.data)
    return ar
}