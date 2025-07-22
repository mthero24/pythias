import {Design} from "@pythias/mongo";
import { DesignsMain as Main } from "@pythias/backend";
import { DesignSearch } from "@/functions/designSearch";
export const dynamic = 'force-dynamic';
export default async function Designs(req) {
    let query = await req.searchParams
    let page = parseInt(query.page ? query.page : 1)
    let designs
    if (!query.q) {
        if (page == undefined || page == 1) {
            designs = await Design.find({}).sort({ _id: -1 }).limit(48)
        } else {
            designs = await Design.find({}).sort({ _id: -1 }).skip((page - 1) * 48).limit(48)
        }
    } else {
        if (page == 1) {
            designs = await Design.find({ sku: query.q }).limit(48)
            if (designs.length == 0) designs = await DesignSearch({ q: query.q, page: page, productsPerPage: 48 })
        } else {
            designs = await Design.find({ sku: query.q }).skip((page - 1) * 48).limit(48)
            if (designs.length == 0) designs = await DesignSearch({ q: query.q, page: page, productsPerPage: 48 })
        }
    }
    let count = designs[0]?.meta?.count?.total ? designs[0]?.meta?.count?.total : await Design.find({}).countDocuments()
    return <Main designs={JSON.parse(JSON.stringify(designs))} ct={count} pa={page} query={query.q} />
}   