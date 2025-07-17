import { serialize } from "@/functions/serialize";
import {LicenseHolders} from "@pythias/mongo";
import {Main} from "@pythias/licenses"
export const dynamic = 'force-dynamic';
export default async function License(){
    let licenses = await LicenseHolders.find({})
    licenses = await serialize(licenses);

    return <Main licenses={licenses}/>

}