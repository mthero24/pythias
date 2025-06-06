import { serialize } from "@/functions/serialize";
import SkuToUpc from "@/models/skuUpcConversion";
import Blank from "@/models/Blanks"
import { Main } from "./Main";
export const dynamic = 'force-dynamic';
export default async function FixeUpc(){
    let skus = await SkuToUpc.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"}).limit(50)
    let count = await SkuToUpc.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).countDocuments()
    console.log(skus.length)
    let blanks = await Blank.find({}).populate("colors");
    skus = serialize(skus)
    blanks = serialize(blanks);
    return <Main s={skus} blanks={blanks} count={count}/>
}