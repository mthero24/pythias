import { Design, Blank, Color, Brands, LicenseHolders, MarketPlaces, ProductImages, PrintLocations, Products, Seasons, Genders } from "@pythias/mongo";
import { CreateSku } from "@/functions/CreateSku";
import { serialize } from "@/functions/serialize";
import { DesignMain } from "@pythias/backend";
import { notFound } from "next/navigation";
export const dynamic = 'force-dynamic';
export default async function DesignPage({ params }) {
    let { id } = await params;
    if (id) {
        try {
            let colors = await Color.find({});
            for (let color of colors) {
                if (!color.sku) {
                    color.sku = color.name.toLocaleLowerCase().replace(/ /g, "").replace(/light/g, "l").replace(/heather/g, "h").substring(0, 7)
                    color = await color.save()
                }
            }
            let printLocations = await PrintLocations.find({})
            let design = await Design.findOne({ _id: id }).lean();
            let products = await Products.find({ design: design._id }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" })
            design.products = products;
            let blanks = await Blank.find({}).select("colors code name sizes multiImages").populate("colors").lean();
            let licenses = await LicenseHolders.find({}).lean();
            let brands = await Brands.find({}).populate("marketPlaces.marketplace").lean();
            let marketPlaces = await MarketPlaces.find({}).lean();
            let genders = await Genders.find().lean()
            let seasons = await Seasons.find().lean()
            let productImages = await ProductImages.find({ design: design._id })
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
            return (
                <DesignMain design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} colors={colors} printLocations={printLocations} CreateSku={CreateSku} seas={seasons} gen={genders} source={"simplysage"} />
            )
        } catch (e) {
            console.log(e)
            return notFound()
        }
    } else {
        return notFound()
    }
}

