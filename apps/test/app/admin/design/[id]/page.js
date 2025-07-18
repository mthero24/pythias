import Design from "@/models/Design";
import Blanks from "@/models/Blanks";
import Brands from "@/models/Brands";
import Locations from "@/models/printLocations"; 
import LicenseHolders from "@/models/LicenseHolders";
import MarketPlaces from "@/models/MarketPlaces";
import ProductImages from "@/models/ProductImages";
import Colors from "@/models/Color";
import { serialize } from "@/functions/serialize";
import {Seasons, Genders} from "@/models/oneoffs";
import {Main} from "./Main";
import { notFound } from "next/navigation";
export const dynamic = 'force-dynamic';
export default async function DesignPage({params}){
    let {id} = await params;
    if(id){
        try{
            let colors = await Colors.find({})
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
            if(!design.threadColors) design.threadColors = []
            let seasons = await Seasons.find({});
            let genders = await Genders.find({});
            design = serialize(design);
            blanks = serialize(blanks);
            brands = serialize(brands);
            marketPlaces = serialize(marketPlaces);
            productImages = serialize(productImages);
            licenses = serialize(licenses);
            printLocations = serialize(printLocations)
            colors = serialize(colors)
            seasons=serialize(seasons)
            genders= serialize(genders)
            return (
                <Main design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} printLocations={printLocations} colors={colors} seas={seasons} gen={genders} source={"PP"}/>
            )
        }catch(e){
            return notFound()
        }
    }else{
        return notFound()
    }
}   

