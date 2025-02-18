import Design from "@/models/Design";
import {Main} from "./Main"
export const dynamic = 'force-dynamic';
export default async function Designs(){
    let designs = await Design.find({}).sort({date: 1}).limit(200)
    return <Main designs={JSON.parse(JSON.stringify(designs))}/>
}   