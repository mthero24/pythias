// Pass the Design model from @pythias/mongo to keep this package model-agnostic.
export async function DesignSearch({ Design, q, productsPerPage, page }) {
    const skip = page * productsPerPage - productsPerPage;

    const project = {
        meta: "$$SEARCH_META",
        _id: 1,
        name: 1,
        images: 1,
        sku: 1,
        sendToMarketplaces: 1,
        b2m: 1,
        blanks: 1,
        brands: 1,
        cleaned: 1,
        description: 1,
        threadColors: 1,
        threadImages: 1,
        score: { $meta: "searchScore" },
    };

    const pipeline = [
        {
            $search: {
                index: "designs",
                text: {
                    query: q,
                    path: ["name", "tags", "sku"],
                    fuzzy: { maxEdits: 2, prefixLength: 3, maxExpansions: 2 },
                    matchCriteria: "any",
                },
                count: { type: "total" },
            },
        },
        { $project: project },
        { $skip: skip },
        { $limit: productsPerPage },
    ];

    const designs = await Design.aggregate([pipeline]);
    return designs;
}
