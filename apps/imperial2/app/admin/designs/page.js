import Design from "@/models/Design";
import {Main} from "./Main"
import {DesignSearch} from "@/functions/designSearch";
export const dynamic = 'force-dynamic';
export default async function Designs(req){
    console.log(await req.searchParams)
    let query = await req.searchParams
    console.log(query)
    let page = parseInt(query.page? query.page: 1)
    console.log(page)
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
    return <Main designs={JSON.parse(JSON.stringify(designs))} ct={count} pa={page} query={query.q}/>
}   