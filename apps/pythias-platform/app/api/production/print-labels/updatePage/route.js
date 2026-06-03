import { NextApiRequest, NextResponse } from "next/server";
import { LabelsData } from "../../../../../functions/labels";

export async function GET(req=NextApiRequest){
    try{
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e})
    }
}