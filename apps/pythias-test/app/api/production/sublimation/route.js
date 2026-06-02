export const dynamic = "force-dynamic";
import {setConfig, createMug} from "@pythias/sublimation";
import {NextApiRequest, NextResponse} from "next/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req= NextApiRequest){
    const sc = await getShippingCreds();
    setConfig({localIP: sc.localIP, localKey: sc.localKey})
    let data = await req.json();
    console.log(data)
    let item = data.item
    console.log(item)
    let res
    if (
      item.styleCode == "CFM" ||
      item.styleCode == "TMUG" ||
      item.styleCode == "BYEH300W" ||
      item.styleCode == "21150"
    ) {
      res = await createMug(item);
    }
    return NextResponse.json(res)
}
