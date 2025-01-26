import {Main} from "./main";
import Blank from "@/modals/Blanks";   

export default async function Blanks(){
    let blanks = await Blank.find({}).select("code name vendor department sales _id").lean();
    blanks = JSON.parse(JSON.stringify(blanks))
    return (
      <Main blanks={blanks}/>
    )
}