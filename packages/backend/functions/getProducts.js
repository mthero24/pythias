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
                                origin: new Date(Date.now()),
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
                    path: ["brand", "sku", "title", "variantsArray.sku"],
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
    if (filters.sportUsedFor) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({
            text: {
                path: "sportsUsedFor",
                query: filters.sportUsedFor.$in
            }
        })
    }
    // Blank (NF) vs design product filter. true → only blank products; false → only non-blank
    // (design) products (mustNot true also matches products with the field missing, i.e. older designs).
    if (filters.isNFProduct === true) {
        if (!query[0].$search.compound.must) query[0].$search.compound.must = [];
        query[0].$search.compound.must.push({ equals: { path: "isNFProduct", value: true } });
    } else if (filters.isNFProduct === false) {
        if (!query[0].$search.compound.mustNot) query[0].$search.compound.mustNot = [];
        query[0].$search.compound.mustNot.push({ equals: { path: "isNFProduct", value: true } });
    }
    const products = await Products.aggregate(query);
    return products;
}

const hasFilters = (filters) => filters && Object.keys(filters).length > 0;

const fallbackProducts = async ({ Products, q, page, productsPerPage }) => {
    const skip = (page - 1) * productsPerPage;
    const filter = q ? { $text: { $search: q } } : {};
    const [products, count] = await Promise.all([
        Products.find(filter)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(productsPerPage)
            .populate("design colors productImages.blank productImages.color productImages.threadColor threadColors")
            .populate({ path: "blanks", populate: "colors" })
            .lean(),
        Products.countDocuments(filter),
    ]);
    return { products, count };
};

// Product-only search — no inventory populate, used by the API search route and getProducts
export const searchProducts = async ({ Products, q, page, filters }) => {
    const productsPerPage = 24;
    const skip = (page - 1) * productsPerPage;

    // Use Atlas Search only when there is an actual query or filter to apply
    if (q || hasFilters(filters)) {
        try {
            const searchResults = await search({ Products, q, page, filters, productsPerPage, skip });
            if (!searchResults?.length) return { products: [], count: 0 };

            const count = searchResults[0].meta.count.total;
            const orderedIds = searchResults.map(p => p._id.toString());
            let products = await Products.find({ _id: { $in: searchResults.map(p => p._id) } })
                .populate("design colors productImages.blank productImages.color productImages.threadColor threadColors")
                .populate({ path: "blanks", populate: "colors" })
                .lean();

            products.sort((a, b) => orderedIds.indexOf(a._id.toString()) - orderedIds.indexOf(b._id.toString()));
            return { products, count };
        } catch (e) {
            console.error("[searchProducts] Atlas Search failed, falling back:", e.message);
            return fallbackProducts({ Products, q, page, productsPerPage });
        }
    }

    // No query/filters — use regular pagination, no Atlas Search needed
    return fallbackProducts({ Products, q: null, page, productsPerPage });
};

// Full page load — search and all filter lookups run in parallel
export const getProducts = async ({ Products, Blanks, page, query, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, PrintTypes, LicenseHolders, filters }) => {
    const [
        { products, count },
        blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, licenses, printTypes, totalProducts,
    ] = await Promise.all([
        searchProducts({ Products, q: query, page, filters: filters ?? {} }),
        Blanks.find().populate("colors").lean(),
        Seasons.find().lean(),
        Genders.find().lean(),
        SportUsedFor.find().lean(),
        Brands.find().lean(),
        MarketPlaces.find().lean(),
        Themes.find().lean(),
        Color.find().lean(),
        LicenseHolders.find().lean(),
        PrintTypes.find().lean(),
        Products.countDocuments(),
    ]);
    return { products, count, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, totalProducts, printTypes, licenses };
};
