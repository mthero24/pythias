import { NextApiRequest, NextResponse } from "next/server";
import { MarketPlaces } from "@pythias/mongo";

export async function GET(req = NextApiRequest) {
    let marketplaces = await MarketPlaces.find().select("_id name productDropDowns").lean();
    return NextResponse.json({ error: false, marketplaces });
}
export async function PUT(req = NextApiRequest) {
    let data = await req.json();
    console.log("data", data)
    let marketplace = await MarketPlaces.findById(data.marketplace);
    if (!marketplace) {
        return NextResponse.json({ error: true, message: "Marketplace not found" });
    }
    if(!marketplace.productDropDowns){
        marketplace.productDropDowns = {};
    }
    if(!marketplace.productDropDowns[data.category]){
        if(data.category == "titleGenerator"){
            marketplace.productDropDowns[data.category] = {
                label: "",
                prompt: ""
            };
        } else {
            marketplace.productDropDowns[data.category] = [];
        }
    }
    if (data.oldValue) {
        marketplace.productDropDowns[data.category] = marketplace.productDropDowns[data.category].filter(v => v !== data.oldValue);
    }
    if(data.value && data.category != "titleGenerator"){
        marketplace.productDropDowns[data.category].push(data.value);
        marketplace.productDropDowns[data.category] = marketplace.productDropDowns[data.category].sort((a, b) => a.localeCompare(b));
    }else if(data.value && data.category == "titleGenerator"){
        if(data.isPrompt){
            marketplace.productDropDowns[data.category].prompt = data.value;
        }
        else{
            marketplace.productDropDowns[data.category].label = data.value;
        }
    }
    console.log(marketplace.productDropDowns)
    marketplace.markModified("productDropDowns");
    await marketplace.save();
    let marketplaces = await MarketPlaces.find().lean();
    return NextResponse.json({ error: false, marketplaces, message: "Category added successfully" });
    
}

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    console.log("data", data)
    let marketplace = await MarketPlaces.findById(data.marketplace);
    if (!marketplace) {
        return NextResponse.json({ error: true, message: "Marketplace not found" });
    }
    if (!marketplace.productDropDowns) {
        marketplace.productDropDowns = {};
    }
    let newCategories = {};
    for (let key in marketplace.productDropDowns) {
        if (key !== data.category) {
            newCategories[key] = marketplace.productDropDowns[key].filter(v => v !== data.oldValue);
        }
    }
    marketplace.productDropDowns = newCategories;
    console.log(marketplace.productDropDowns)
    marketplace.markModified("productDropDowns");
    await marketplace.save();
    let marketplaces = await MarketPlaces.find().lean();
    return NextResponse.json({ error: false, marketplaces, message: "Category added successfully" });

}


