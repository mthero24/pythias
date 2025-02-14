import Design from "@/models/Design";
import Blanks from "@/models/Blanks";
import Brands from "@/models/Brands";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
import { notFound } from "next/navigation";
export default async function DesignPage({params}){
    let {id} = await params;
    let design = await Design.findOne({_id: id}).populate({path: "blanks.blank", populate: "colors"}).populate("brands").lean();
    let blanks = await Blanks.find({}).select("colors code").populate("colors").lean()
    let brands = await Brands.find({}).populate("marketPlaces.marketplace")
    if(!design) return notFound();
    console.log(blanks)
    design = serialize(design);
    blanks = serialize(blanks);
    brands = serialize(brands)
    return (
        <Main design={design} blanks={blanks} brands={brands}/>
    )
}   

