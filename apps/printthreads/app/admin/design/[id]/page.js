import { Design, Blank, Color, LicenseHolders, MarketPlaces, ProductImages, PrintLocations, Products, Seasons, Genders, Themes, SportUsedFor, Brands, PrintTypes, } from "@pythias/mongo";
import { CreateSku } from "@/functions/CreateSku";
import { DesignMain, serialize } from "@pythias/backend";
import { notFound } from "next/navigation";
import {designPage} from "@pythias/backend";
import { Print } from "@mui/icons-material";
export const dynamic = 'force-dynamic';
export default async function DesignPage({ params }) {
    let { id } = await params;
    console.log(id, "Design ID");
    ///some orhter change
    if (id) {
        try {
            let {design, blanks, brands, marketPlaces, productImages, licenses, colors, printLocations, genders, seasons, sportUsedFor, themes, printTypes} = await designPage({
                id,
                LicenseHolders,
                Brands,
                Color,
                PrintLocations,
                Design,
                Products,
                Blank,
                LicenseHolders,
                Brands,
                MarketPlaces,
                Genders,
                Seasons,
                SportUsedFor,
                Themes,
                ProductImages,
                PrintTypes,
            });
            console.log(design, "DESIGN DATA")
            return (
                <DesignMain design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} colors={colors} printLocations={printLocations} CreateSku={CreateSku} seas={seasons} gen={genders} source={"test"} them={themes} sport={sportUsedFor} printTypes={printTypes} />
            )
        } catch (e) {
            console.log(e)
            return notFound()
        }
    } else {
        return notFound()
    }
}

