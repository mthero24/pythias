import {NextApiRequest, NextResponse} from "next/server";


export async function  POST(req=NextApiRequest){
    let data = await req.data()
    return NextResponse.json({error: false})
}