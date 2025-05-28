import Design from "@/models/Design";
import {Main} from "./Main"
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
            designs = await Design.find({}).sort({date: -1}).limit(200)
        }else{
            console.log("page > 1", (page - 1) * 200)
            designs = await Design.find({}).sort({date: -1}).skip((page - 1) * 200).limit(200)
        }
    }else{
        if(page == 1){
            designs = await Design.find({sku: query.q}).limit(200)
            if(designs.length == 0) designs = await Design.find({name: {$regex: query.q, $options: "si"}}).limit(200)
            console.log(designs.length)
        }else{
            designs = await Design.find({sku: query.q}).skip((page - 1) * 200).limit(200)
            if(designs.length == 0) designs = await Design.find({name: {$regex: query.q, $options: "si"}}).skip((page - 1) * 200).limit(200)
            console.log(designs.length)
        }
    }
    let count = await Design.find({}).countDocuments()
    return <Main designs={JSON.parse(JSON.stringify(designs))} count={count}/>
}   