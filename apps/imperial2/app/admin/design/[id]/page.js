import {Design, Blank, Color, Brands, LicenseHolders, MarketPlaces, ProductImages, PrintLocations} from "@pythias/mongo";

import { serialize } from "@/functions/serialize";
import {DesignMain} from "@pythias/backend";
import { notFound } from "next/navigation";
import { Noto_Serif_Makasar } from "next/font/google";
export const dynamic = 'force-dynamic';
export default async function DesignPage({params}){
    let {id} = await params;
    if(id){
        try{
            let colors = await Color.find({});
            for(let color of colors){
                if(!color.sku){
                    color.sku = color.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").substring(0, 7)
                   // console.log(color.sku)
                    color = await color. save()
                }
            }
            let printLocations = await PrintLocations.find({})
            let design = await Design.findOne({_id: id}).lean();
            //console.log(design, "design")
            let blanks = await Blank.find({}).select("colors code name sizes multiImages").populate("colors").lean();
            //console.log(blanks[0].colors[0], "color")
            let licenses = await LicenseHolders.find({}).lean();
            let brands = await Brands.find({}).populate("marketPlaces.marketplace").lean();
            let marketPlaces = await MarketPlaces.find({}).lean();
            let productImages = await ProductImages.find({design: design._id})
            if(!design) return notFound();
            //console.log(printLocations)
            design = serialize(design);
            blanks = serialize(blanks);
            brands = serialize(brands);
            marketPlaces = serialize(marketPlaces);
            productImages = serialize(productImages);
            licenses = serialize(licenses);
            colors = serialize(colors)
            printLocations = serialize(printLocations)
            return (
                <DesignMain design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} colors={colors} printLocations={printLocations}/>
            )
        }catch(e){
            console.log(e)
            return notFound()
        }
    }else{
        return notFound()
    }
}   

