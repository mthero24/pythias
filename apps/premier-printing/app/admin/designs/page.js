import {Design, Products, User} from "@pythias/mongo";
import { DesignsMain as Main } from "@pythias/backend";
import { DesignSearch } from "@/functions/designSearch";
import { headers } from "next/headers";
export const dynamic = 'force-dynamic';
export default async function Designs(req) {
    let query = await req.searchParams
    let page = parseInt(query.page ? query.page : 1)
    const headersList = await headers()
    const user = await User.findOne({ userName: headersList.get("user") }).select("permissions").lean()
    const canEdit = Boolean(user?.permissions?.designs)
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

    // Attach product counts
    const designIds = designs.map(d => d._id ?? d.id).filter(Boolean)
    const productCounts = await Products.aggregate([
        { $match: { design: { $in: designIds } } },
        { $group: { _id: "$design", count: { $sum: 1 } } }
    ])
    const countMap = Object.fromEntries(productCounts.map(p => [p._id.toString(), p.count]))
    designs = designs.map(d => {
        const plain = d.toJSON ? d.toJSON() : { ...d }
        plain.productCount = countMap[plain._id?.toString()] ?? 0
        return plain
    })

    return <Main designs={JSON.parse(JSON.stringify(designs))} ct={count} pa={page} query={query.q} canEdit={canEdit} />
}