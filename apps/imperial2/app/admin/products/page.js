import {CSVUpdates} from "@pythias/mongo";
import {Main} from "./Main"
import {serialize} from "@/functions/serialize"
export const dynamic = 'force-dynamic';
//server components
export default async function Products(){
    let active = await CSVUpdates.findOne({active: true})
    let past = await CSVUpdates.find({active: false})
    let act = serialize(active)
    past = serialize(past)
    return <Main act={act} past={past}/>
}
