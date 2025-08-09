import {setConfig, createMug} from "@pythias/sublimation";
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req= NextApiRequest){
    console.log(process.env.localKey, "localkey");
    setConfig({localIP: process.env.localIP, localKey: process.env.localKey})
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
