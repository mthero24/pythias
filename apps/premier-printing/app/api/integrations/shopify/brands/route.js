import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
import Brands from "@/models/Brands";
import User from "@/models/User";

export async function GET(req=NextApiRequest){
     const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    console.log("Authorization:", authorizationHeader);
    let password = authorizationHeader.split(" ")[1]
    console.log(password)
    let user = await User.findOne({password: password})
    console.log(user)
    if(user){
        let filtered = []
        let brands = await Brands.find({})
        for(let b of brands){
            if(!filtered.filter(br=> br.name == b.name)[0]){
                filtered.push(b)
            }
        }
        return NextResponse.json({error: false, brands: filtered})
    }
    return NextResponse.json({error: true, msg: "Unauthorized"})
}