import Design from "@/models/Design";
import Blanks from "@/models/Blanks";
import Colors from "@/models/Color";
import Locations from "@/models/printLocations";
import Brands from "@/models/Brands";
import LicenseHolders from "@/models/LicenseHolders";
import MarketPlaces from "@/models/MarketPlaces";
import ProductImages from "@/models/ProductImages";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
import { notFound } from "next/navigation";
import { Noto_Serif_Makasar } from "next/font/google";
export const dynamic = 'force-dynamic';
export default async function DesignPage({params}){
    let {id} = await params;
    if(id){
        try{
            let colors = await Colors.find({});
            for(let color of colors){
                if(!color.sku){
                    color.sku = color.name.replace(/ /g, "").substring(0, 5)
                    console.log(color.sku)
                    color = await color. save()
                }
            }
            let printLocations = await Locations.find({})
            let design = await Design.findOne({_id: id}).lean();
            let blanks = await Blanks.find({}).select("colors code name sizes multiImages").populate("colors").lean();
            //console.log(blanks[0].colors[0], "color")
            let licenses = await LicenseHolders.find({}).lean();
            let brands = await Brands.find({}).populate("marketPlaces.marketplace").lean();
            let marketPlaces = await MarketPlaces.find({}).lean();
            let productImages = await ProductImages.find({design: design._id})
            if(!design) return notFound();
            //console.log(blanks)
            design = serialize(design);
            blanks = serialize(blanks);
            brands = serialize(brands);
            marketPlaces = serialize(marketPlaces);
            productImages = serialize(productImages);
            licenses = serialize(licenses);
            colors = serialize(colors)
            printLocations = serialize(printLocations)
            return (
                <Main design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} colors={colors} printLocations={printLocations}/>
            )
        }catch(e){
            return notFound()
        }
    }else{
        return notFound()
    }
}   

