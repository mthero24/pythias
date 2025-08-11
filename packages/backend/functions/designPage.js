import { serialize } from "./serialize";
export const designPage = async ({id, Brands, LicenseHolders, Color, PrintLocations, Design, Products, Blank, MarketPlaces, Genders, Seasons, SportUsedFor, Themes, ProductImages})=>{
    let colors = await Color.find({});
    for (let color of colors) {
        if (!color.sku) {
            if (color.name.includes("Plaid")) {
                color.sku = color.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").replace("vintage", "v").replace("and", "").replace("top", "").replace(/black/g, "bl").replace("plaid", "pl").replace(/white/g, "wh").replace("red", "re").substring(0, 7)
            }
            else color.sku = color.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").replace("vintage", "v").replace("and", "").substring(0, 7)
            color = await color.save()
        }
    }
    let printLocations = await PrintLocations.find({})
    let design = await Design.findOne({ _id: id }).lean();
    let products = await Products.find({ design: design._id }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.blank variantsArray.color variantsArray.threadColor").populate({ path: "blanks", populate: "colors" })
    //console.log(products[0], "Products in designPage");
    design.products = products;
    let blanks = await Blank.find({}).select("colors code name sizes multiImages").populate("colors").lean();
    let licenses = await LicenseHolders.find({}).lean();
    let brands = await Brands.find({}).populate("marketPlaces.marketplace").lean();
    let marketPlaces = await MarketPlaces.find({}).lean();
    let genders = await Genders.find().lean()
    let seasons = await Seasons.find().lean()
    let themes = await Themes.find().lean()
    let sportUsedFor = await SportUsedFor.find().lean()
    let productImages = await ProductImages.find({ design: design._id }).lean();
    if (!design) return notFound();
    design = serialize(design);
    blanks = serialize(blanks);
    brands = serialize(brands);
    marketPlaces = serialize(marketPlaces);
    productImages = serialize(productImages);
    licenses = serialize(licenses);
    colors = serialize(colors)
    printLocations = serialize(printLocations)
    genders = serialize(genders)
    seasons = serialize(seasons)
    sportUsedFor = serialize(sportUsedFor)
    themes = serialize(themes)
    return {design, blanks, brands, marketPlaces, productImages, licenses, colors, printLocations, genders, seasons, sportUsedFor, themes}
}