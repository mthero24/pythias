import { serialize } from "@/functions/serialize"
import {ReturnBins as Bins} from "@pythias/mongo";
import {Main} from "@pythias/returns"
export const dynamic = 'force-dynamic';
export default async function Returns(){
    let binsInUse = await Bins.find({inUse: true}).populate("inventory.design", "sku images threadImages").populate("inventory.threadColor", "name").populate("blank", "sizes code multiImages").populate("color", "name")
    let binCount = await Bins.find().countDocuments()
    binsInUse = serialize(binsInUse)
    return <Main binsInUse={binsInUse} binCount={binCount} source={"IM"} />
}