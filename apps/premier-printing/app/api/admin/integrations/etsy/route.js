import {NextApiRequest, NextResponse} from "next/server"
import { ApiKeyIntegrations } from "@pythias/mongo";
import {createDraftListing, updateListingFrom} from "@pythias/integrations";

export async function GET(req){
    return Response.json({error: "not implemented"})
}

export async function POST(req=NextApiRequest) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    let res = await createDraftListing(body.product, connection);
    return NextResponse.json({ success: true, productId: res });
}

export async function PUT(req = NextApiRequest) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    await updateListingFrom(body.listingId, body.product, connection);
    return NextResponse.json({ success: true });
}