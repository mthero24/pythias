import {NextApiRequest, NextResponse} from "next/server"
import { ApiKeyIntegrations } from "@pythias/mongo";
import {createDraftListing} from "@pythias/integrations";
import axios from "axios";
export async function GET(req){
    return Response.json({error: "not implemented"})
}

export async function POST(req=NextApiRequest) {
    const body = await req.json();
    console.log(body, "body+++++++")
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    console.log(connection, "connection +++++++")
    let res = await createDraftListing(body.product, connection);
    console.log(res, "res from etsy +++++++")
    return NextResponse.json({ success: true, productId:res });
}