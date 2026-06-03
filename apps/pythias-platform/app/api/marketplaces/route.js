import { NextResponse } from "next/server";
import { PlatformMarketPlace as MarketPlaces } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let marketplaces = await MarketPlaces.find({ orgId }).select("_id name productDropDowns required variantTitle").lean();
    return NextResponse.json({ error: false, marketplaces });
}
export async function PUT(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    let marketplace = await MarketPlaces.findOne({ _id: data.marketplace, orgId });
    if (!marketplace) {
        return NextResponse.json({ error: true, message: "Marketplace not found" });
    }
    if(!marketplace.productDropDowns){
        marketplace.productDropDowns = {};
    }
    if(data.oldCategory && data.oldCategory !== data.category && data.category != "required"){
        marketplace.productDropDowns[data.category] = marketplace.productDropDowns[data.oldCategory];
        delete marketplace.productDropDowns[data.oldCategory];
        console.log(marketplace.required, "marketplace.required in route.js before delete")
    }
    if(!marketplace.productDropDowns[data.category]){
        if(data.category == "titleGenerator"){
            marketplace.productDropDowns[data.category] = {
                label: "",
                prompt: ""
            };
        }else if(data.category == "required"){
            if(!marketplace.required) marketplace.required = {};
            console.log(marketplace.required, "marketplace.required in route.js before update")
            marketplace.required[data.oldCategory] = data.value
        } else {
            marketplace.productDropDowns[data.category] = [];
        }
    }
    if (data.oldValue) {
        marketplace.productDropDowns[data.category] = marketplace.productDropDowns[data.category].filter(v => v !== data.oldValue);
    }
    if(data.value && data.category != "titleGenerator" && data.category != "required"){
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
    console.log(marketplace.required, "marketplace.required in route.js")
    marketplace.markModified("productDropDowns");
    marketplace.markModified("required");
    await marketplace.save();
    let marketplaces = await MarketPlaces.find({ orgId }).lean();
    return NextResponse.json({ error: false, marketplaces, message: "Category added successfully" });
}

export async function PATCH(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const data = await req.json();
    const marketplace = await MarketPlaces.findOne({ _id: data.marketplace, orgId });
    if (!marketplace) return NextResponse.json({ error: true, message: "Marketplace not found" });
    if (data.variantTitle !== undefined) marketplace.variantTitle = data.variantTitle;
    await marketplace.save();
    const marketplaces = await MarketPlaces.find({ orgId }).select("_id name productDropDowns required variantTitle").lean();
    return NextResponse.json({ error: false, marketplaces });
}

export async function POST(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    console.log("data", data)
    let marketplace = await MarketPlaces.findOne({ _id: data.marketplace, orgId });
    if (!marketplace) {
        return NextResponse.json({ error: true, message: "Marketplace not found" });
    }
    if (!marketplace.productDropDowns) {
        marketplace.productDropDowns = {};
    }
    let newCategories = {};
    for (let key in marketplace.productDropDowns) {
        if (key !== data.category) {
            newCategories[key] = marketplace.productDropDowns[key];
        }
    }
    marketplace.productDropDowns = newCategories;
    console.log(marketplace.productDropDowns)
    marketplace.markModified("productDropDowns");
    await marketplace.save();
    let marketplaces = await MarketPlaces.find({ orgId }).lean();
    return NextResponse.json({ error: false, marketplaces, message: "Category added successfully" });

}


