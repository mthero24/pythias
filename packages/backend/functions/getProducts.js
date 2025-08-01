

export const getProducts = async ({ Products, page, query }) => {
    const products = await Products.find().skip((page - 1) * 24).limit(24).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    const count = await Products.find({}).countDocuments();
    return { products, count };
}