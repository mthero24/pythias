import { serialize } from "@/functions/serialize"
import {Blank} from "@pythias/mongo"
import {Main} from "@pythias/returns"
export const dynamic = 'force-dynamic';
export default async function Returns(){
    let blanks = await Blank.find({ }).populate("colors").lean()
    blanks = await serialize(blanks)
    return <Main blanks={blanks} source={"PP"} />
}