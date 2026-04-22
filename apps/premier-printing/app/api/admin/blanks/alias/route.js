import { NextApiRequest, NextResponse } from "next/server";
import {Blank, Color } from "@pythias/mongo";


export async function POST(req=NextApiRequest){
    let data = await req.json();
    console.log(data, data.options.colors, "data in alias route")
    //console.log(data.selectedBlanks, data.options.details, data.selectedBlanks.find(b=> b._id.toString() == data.options.details))
    let details = {}
    let blanks = await Blank.find({_id: {$in: data.selectedBlanks.map(b=> b._id)}}).lean()
    let images = []
    //console.log(details)
    for(let key of Object.keys(data.selectedBlanks.find(b=> b._id.toString() == data.options.details))){
        if(key != "_id" && key != "code") details[key] = data.selectedBlanks.find(b=> b._id.toString() == data.options.details)[key]
    }
    let combinedColors = []
    if(data.colorsToUse == "combined"){
        for(let color of data.options.colors){
            console.log(color.combinedColors, "color.combinedColors")
            let c = await Color.findOne({name: color.name})
            if(!c) {
                c = new Color({ name: color.name, hexcode: color.hexcode, sku: color.sku, colors: color.combinedColors, combined: true })
                c = await c.save()
            }
            combinedColors.push(c._id)
        }
    }
    else{
        images = [...details.images.filter(i => data.options.colors.map(c => c._id.toString()).includes(i.color.toString()))]
        combinedColors = data.options.colors
    }
    let blank = new Blank({...details, images, blanks: data.selectedBlanks, code: data.options.code, sizes: data.options.sizes, colors: combinedColors, type: "alias"})
    //console.log(blank)
    blank = await blank.save()
    return NextResponse.json({error: false, blank})
}