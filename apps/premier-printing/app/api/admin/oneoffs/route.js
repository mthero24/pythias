import {NextApiRequest, NextResponse} from "next/server";
import { Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons } from "@pythias/mongo";
import {saveOneOffs} from "@pythias/backend";
export async function POST(req = NextApiRequest){
    let data = await req.json()
    console.log(data)
    try{
        const { seasons, genders, themes, sports, departments, brands, suppliers, vendors, printTypes, repullReasons } = await saveOneOffs({ data, Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons });
        return NextResponse.json({error: false, seasons, genders, themes, sports, departments, brands, suppliers, vendors, printTypes, repullReasons})
    }catch(e){
        console.error("Error saving one-offs", e)
        return NextResponse.json({error: true, msg: `Error saving ${data.type}`})
    }
}