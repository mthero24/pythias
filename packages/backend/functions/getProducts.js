import mongoose from "mongoose";
const search = async ({Products, q, page, filters, productsPerPage, skip}) => {
    const project = {
        meta: "$$SEARCH_META",
        _id: 1,
    };
    let query = [
        {
            $search: {
                index: "products",
                compound:{
                    should: [
                        {
                            near: {
                                path: `lastUpdated`,
                                origin: new Date(),
                                pivot: 304800000,
                                score: { boost: { value: 99999 } },
                            },
                        }
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
    if(q) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                query: q,
                    path: ["title", "sku", "variantsArray.sku", "tags"],
                        fuzzy: {
                    maxEdits: 2,
                        prefixLength: 3,
                            maxExpansions: 2
                },
                matchCriteria: "any"
            }
        });
    }
    if(filters.blanks){
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            in: {
                path: "blanks",
                value: filters.blanks.$in.map(i => new mongoose.Types.ObjectId(i))
            }
        })
    }
    if(filters.marketPlacesArray){
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            in: {
                path: "marketPlacesArray",
                value: filters.marketPlacesArray.$in.map(i => new mongoose.Types.ObjectId(i))
            }
        })
    }
    if (filters.department) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "department",
                query: filters.department.$in
            }
        })
    }
    if (filters.category) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "category",
                query: filters.category.$in
            }
        })
    }
    if (filters.brand) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "brand",
                query: filters.brand.$in
            }
        })
    }
    if (filters.season) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "season",
                query: filters.season.$in
            }
        })
    }
    if (filters.gender) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "gender",
                query: filters.gender.$in
            }
        })
    }
    if (filters.sportsUsedFor) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "sportsUsedFor",
                query: filters.sportsUsedFor.$in
            }
        })
    }
    const products = await Products.aggregate(query);
    return products;
}

export const getProducts = async ({ Products, Blanks, page, query, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, filters }) => {
    let products
    let count
    products = await search({ Products, q: query, page, filters, productsPerPage: 24, skip: (page - 1) * 24 });
    if(products && products.length > 0){
        count = products[0].meta.count.total
        products = await Products.find({_id: {$in: products.map(p => p._id)}}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    }
    const blanks = await Blanks.find().populate("colors");
    const seasons = await Seasons.find();
    const genders = await Genders.find();
    const sportsUsedFor = await SportUsedFor.find();
    const brands = await Brands.find();
    const marketplaces = await MarketPlaces.find();
    const themes = await Themes.find();
    const colors = await Color.find();
    const totalProducts = await Products.countDocuments();
    return { products, count, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, totalProducts };
}