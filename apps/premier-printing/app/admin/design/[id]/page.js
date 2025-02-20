import Design from "@/models/Design";
import Blanks from "@/models/Blanks";
import Brands from "@/models/Brands";
import MarketPlaces from "@/models/MarketPlaces";
import ProductImages from "@/models/ProductImages";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
import { notFound } from "next/navigation";
export const dynamic = 'force-dynamic';
export default async function DesignPage({params}){
    let {id} = await params;
    let design = await Design.findOne({_id: id}).lean();
    let blanks = await Blanks.find({}).select("colors code name sizes multiImages").populate("colors").lean()
    console.log(blanks[0].colors[0], "color")
    let brands = await Brands.find({}).populate("marketPlaces.marketplace").lean()
    let marketPlaces = await MarketPlaces.find({}).lean()
    let productImages = await ProductImages.find({design: design._id})
    if(!design) return notFound();
    console.log(blanks)
    design = serialize(design);
    blanks = serialize(blanks);
    brands = serialize(brands)
    marketPlaces = serialize(marketPlaces)
    productImages = serialize(productImages)
    return (
        <Main design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} />
    )
}   

