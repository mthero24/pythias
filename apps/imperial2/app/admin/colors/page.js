import {Color} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Main } from "./Main";
export const dynamic = 'force-dynamic';
export default async function Colors(){
    let colors = await Color.find({}).lean()
    colors = serialize(colors)
    return (<Main colors={colors} />)
}