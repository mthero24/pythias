import {NextApiResponse, NextResponse} from "next/server";
import {MarketPlaces, Products} from "@pythias/mongo";
import {downloadProduct} from "@pythias/backend";

export async function GET(req = NextApiResponse, ) {
    let data = { marketPlace: req.nextUrl.searchParams.get("marketPlace"), product: req.nextUrl.searchParams.get("product"), header: req.nextUrl.searchParams.get("header") };
    let marketPlace = await MarketPlaces.findOne({_id: data.marketPlace}).lean();
    let product = await Products.findOne({_id: data.product}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"}).lean();
    if(!marketPlace || !product) {
        return NextResponse.json({error: true, message: "MarketPlace or Product not found"});
    }
    let buffer = await downloadProduct({product, marketPlace, header: data.header});
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'text/csv',
            "Access-Control-Allow-Origin": "*",
            'Content-Disposition': `attachment; filename="${marketPlace.name}-${new Date(Date.now()).toLocaleDateString("en-US")}-${new Date(Date.now()).getHours() % 12}:${new Date(Date.now()).getMinutes().length > 2 ? new Date(Date.now()).getMinutes(): `0${new Date(Date.now()).getMinutes()}`}${new Date(Date.now()).getHours() < 12 ? "AM" : "PM"}.csv"`
        }
    })
}