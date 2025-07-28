import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size} from "@pythias/mongo"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
   let temps = await SkuToUpcOld.find({temp: true}).lean()
   console.log(temps)
    for(let temp of temps){
        await SkuToUpc.create(temp)
        await SkuToUpcOld.findOneAndDelete({_id: temp._id})
    }

    return <h1>test</h1>
}