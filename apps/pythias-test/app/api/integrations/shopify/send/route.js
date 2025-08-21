import {NextApiRequest, NextResponse} from "next/server";
import axios from "axios";
export async function POST(req=NextApiRequest) {
    console.log("Sending data to Shopify");
    const body = await req.json();
    console.log(body, "body");
    const headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${body.connection.apiKey}`,
        }
    }
    let res = await axios.post("http://shopapp.pythiastechnologies.com/webhooks/products", {...body}, headers).catch(e => { console.log(e.response.data) })
    console.log(res?.data, "res data")
    return NextResponse.json({...res?.data,});
}