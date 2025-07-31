import CSVUpdates from "@/models/CSVUpdates"
import {Main} from "./Main"
import {serialize} from "@pythias/backend";
export const dynamic = 'force-dynamic';
//server components
export default async function Products(){
    let active = await CSVUpdates.findOne({active: true})
    let past = await CSVUpdates.find({active: false})
    let act = serialize(active)
    past = serialize(past)
    console.log(past)
    return <Main act={act} past={past}/>
}
