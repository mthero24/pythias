import Color from "@/models/Color";
import { serialize } from "@/functions/serialize";
import { Main } from "./Main";
export default async function Colors(){
    let colors = await Color.find({}).lean()
    colors = serialize(colors)
    return (<Main colors={colors} />)
}