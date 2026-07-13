import {ProductInventory} from "@pythias/mongo"
const search = async ({q, page, skip, productsPerPage, filter}) => {
    const project = {
        meta: "$$SEARCH_META",
        _id: 1,
    };
    let query = [
        {
            $search: {
                index: "ProductInventory",
                compound:{
                    must: [
                        {text: {
                            query: q,
                            // Search the full SKU + blank/color/size, not just the design portion.
                            // Records created without a linked design have no designSku, so a
                            // designSku-only search made them unfindable (e.g. GDT_yam_S_26800M_F).
                            // All five paths are indexed in the Atlas "ProductInventory" index.
                            path: ["designSku", "sku", "blankCode", "colorName", "sizeName"],
                            matchCriteria: "any"
                        }}
                    ]
                },
                count: {
                    type: "total",
                },
            },
        },
        {
            $project: project,
        },
        {
            $skip: skip,
        },
        {
            $limit: productsPerPage,
        },
    ];
    if(filter && filter.blank){
        query[0].$search.compound.must.push({text: {
            query: filter.blank,
            path: "blankCode",
            matchCriteria: "any"
        }});
    }
    if(filter && filter.color){
        query[0].$search.compound.must.push({text: {
            query: filter.color,
            path: "colorName",
            matchCriteria: "any"
        }});
    }
    if(filter && filter.size){
        query[0].$search.compound.must.push({text: {
            query: filter.size,
            path: "sizeName",
            matchCriteria: "any"
        }});
    }
    const products = await ProductInventory.aggregate(query);
    console.log(products, "products")
    return products;
}

export const getProductInventory = async ({ q, page, filter }) => {
    const productsPerPage = 50;
    const skip = (page - 1) * productsPerPage;
    console.log(q, page, skip)
    const inventories = await search({  q, page, skip: skip, productsPerPage, filter });
    const count = inventories.length > 0 ? inventories[0].meta.count.total : 0;
    
    return { inventories, count };
}