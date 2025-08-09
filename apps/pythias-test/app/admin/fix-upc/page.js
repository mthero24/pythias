import { serialize } from "@/functions/serialize";
import SkuToUpc from "@/models/skuUpcConversion";
import Blank from "@/models/Blanks"
import { Main } from "./Main";
export const dynamic = 'force-dynamic';
export default async function FixeUpc(){
    let skus = await SkuToUpc.find({$or: [{design: null},{color: null}, {blank: null}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"})
    let count = await SkuToUpc.find({$or: [{design: null},{color: null}, {blank: null}]}).countDocuments()
    console.log(skus.length)
    let blanks = await Blank.find({}).populate("colors");
    skus = serialize(skus)
    blanks = serialize(blanks);
    return <Main s={skus} blanks={blanks} count={count}/>
}