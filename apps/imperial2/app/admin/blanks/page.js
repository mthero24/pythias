import {Main} from "./main";
import Blank from "@/models/Blanks";   
export const dynamic = 'force-dynamic'; 
export default async function Blanks(){
    let blanks = await Blank.find({}).select("code name vendor department sales _id").lean().catch(e=>{console.log(e)});
    console.log(blanks)
    if(blanks)blanks = JSON.parse(JSON.stringify(blanks))
    else blanks = []
    return (
      <Main blanks={blanks}/>
    )
}