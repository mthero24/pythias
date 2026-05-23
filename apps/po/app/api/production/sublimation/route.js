export const dynamic = "force-dynamic";
import {setConfig, createMug} from "@pythias/sublimation";
import {NextApiRequest, NextResponse} from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";

export async function POST(req= NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
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
    if (res && !res.error) {
        logActivity({ action: "sublimation_sent", entity: "order", entityName: item.pieceId || item.styleCode || "", userName, email, provider: "po" });
    }
    return NextResponse.json(res)
}
