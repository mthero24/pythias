import {NextApiRequest, NextResponse} from "next/server";


export async function GET(req=NextApiRequest){
    console.log("++++++++++++++++++++++++++++++")
    console.log("")
    console.log(req.nextUrl.searchParams.get("app_key"))
    console.log(req.nextUrl.searchParams.get("code"))
    console.log(req.nextUrl.searchParams.get("locale"))
    console.log(req.nextUrl.searchParams.get("region"))
    console.log("")
    console.log("")
    console.log("++++++++++++++++++++++++++++++")
    return NextResponse.json({error: false})
}