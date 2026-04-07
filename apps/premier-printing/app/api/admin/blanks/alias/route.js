import { NextApiRequest, NextResponse } from "next/server";
import {Blank } from "@pythias/mongo";


export async function POST(req=NextApiRequest){
    let data = await req.json();
   // console.log(data)
    //console.log(data.selectedBlanks, data.options.details, data.selectedBlanks.find(b=> b._id.toString() == data.options.details))
    let details = {}
    console.log(details)
    for(let key of Object.keys(data.selectedBlanks.find(b=> b._id.toString() == data.options.details))){
        if(key != "_id" && key != "code") details[key] = data.selectedBlanks.find(b=> b._id.toString() == data.options.details)[key]
    }
    let blank = new Blank({...details, blanks: data.selectedBlanks, code: data.options.code, sizes: data.options.sizes, type: "alias"})
    if(data.colorsToUse == "combined") blank.aliasColors = data.options.colorsToUse
    else blank.colors = data.options.colors
    console.log(blank)
    blank = await blank.save()
    return NextResponse.json({error: false, blank})
}