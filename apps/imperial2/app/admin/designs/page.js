import {Design} from "@pythias/mongo";
import { DesignsMain } from "@pythias/backend";
import {DesignSearch} from "@/functions/designSearch";
import { serialize } from "@/functions/serialize";
export const dynamic = 'force-dynamic';
export default async function Designs(req){
    let query = await req.searchParams
    let page = parseInt(query.page? query.page: 1)
    let designs
    if(!query.q){
        if(page == undefined || page == 1){
            console.log("page = 1 or undefined")
            designs = await Design.find({}).sort({_id: -1}).limit(48)
        }else{
            console.log("page > 1", (page - 1) * 48)
            designs = await Design.find({}).sort({_id: -1}).skip((page - 1) * 48).limit(48)
        }
    }else{
        if(page == 1){
            designs = await Design.find({sku: query.q}).limit(48)
            if (designs.length == 0) designs = await DesignSearch({q: query.q, page: page, productsPerPage: 48})
            console.log(designs.length)
        }else{
            designs = await Design.find({sku: query.q}).skip((page - 1) * 48).limit(48)
            if (designs.length == 0) designs = await DesignSearch({ q: query.q, page: page, productsPerPage: 48 })
            console.log(designs[0].meta.count.total)
            console.log(designs.length)
        }
    }
    let count = designs[0]?.meta?.count?.total ? designs[0]?.meta?.count?.total : await Design.find({}).countDocuments()
    // for(let d of designs){
    //     let images = {}
    //     for(let i of Object.keys(d.images? d.images: {})){
    //         if(d.images[i] ){
    //             images[i] = d.images[i]
    //         }
    //     }
    //     if(Object.keys(images).length != 0){
    //         d.images = images;
    //         await d.save();
    //     }
    // }
    designs = serialize(designs)
    return <DesignsMain designs={designs} ct={count} pa={page} query={query.q}/>
    
}   