import { serialize } from "@/functions/serialize"
import Bins from "@/models/returnBins"
import {Main} from "@pythias/returns"
export const dynamic = 'force-dynamic';
export default async function Returns(){
    let binsInUse = await Bins.find({inUse: true}).populate("design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
    let binCount = await Bins.find().countDocuments()
    binsInUse = serialize(binsInUse)
    return <Main binsInUse={binsInUse} binCount={binCount} source={"PP"} />
}