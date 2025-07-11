import CSVUpdates from "@/models/CSVUpdates"
import {Main} from "./Main"
import {serialize} from "@/functions/serialize"
export const dynamic = 'force-dynamic';
export default async function Products(){
    let active = await CSVUpdates.findOne({active: true})
    let past = await CSVUpdates.find({active: false})
    let act = serialize(active)
    past = serialize(past)
    //console.log(past)
    return <Main act={act} past={past}/>
}
