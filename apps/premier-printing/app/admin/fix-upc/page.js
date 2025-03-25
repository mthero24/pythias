import { serialize } from "@/functions/serialize";
import SkuToUpc from "@/models/skuUpcConversion";
import Blank from "@/models/Blanks"
import { Main } from "./Main";

export default async function FixeUpc(){
    let skus = await SkuToUpc.find({$or: [ {color: null, blank: {$ne: null}}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"}).limit(50)
    console.log(skus.length)
    let blanks = await Blank.find({}).populate("colors");
    skus = serialize(skus)
    blanks = serialize(blanks);
    return <Main s={skus} blanks={blanks}/>
}