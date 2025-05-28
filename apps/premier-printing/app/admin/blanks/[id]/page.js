import Blank from "@/models/Blanks";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
export const dynamic = 'force-dynamic'; 
export default async function Show(req, res){
    //console.log(await req.params);
    let {id} = await req.params;
    let blank = await Blank.findById(id).select("_id name code sales vendor kohlsHeader targetHeader, shopSimonHeader").lean()
    blank = serialize(blank);
    return <Main blank={blank} />
}