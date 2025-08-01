

export const getProducts = async ({ Products, Blanks, page, query, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, filters }) => {
    const products = await Products.find().skip((page - 1) * 24).limit(24).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    const blanks = await Blanks.find().populate("colors");
    const count = await Products.find({}).countDocuments();
    const seasons = await Seasons.find();
    const genders = await Genders.find();
    const sportsUsedFor = await SportUsedFor.find();
    const brands = await Brands.find();
    const marketplaces = await MarketPlaces.find();
    const themes = await Themes.find();
    const colors = await Color.find();
    return { products, count, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors };
}