import { serialize } from "@/functions/serialize";
import LicenseHolders from "@/models/LicenseHolders";
import {Main} from "@pythias/licenses"

export default async function License(){
    let licenses = await LicenseHolders.find({})
    licenses = await serialize(licenses);

    return <Main licenses={licenses}/>

}