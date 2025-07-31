import { Design, Blank, Color, Brands, LicenseHolders, MarketPlaces, ProductImages, PrintLocations, Products, Seasons, Genders, Themes, SportUsedFor } from "@pythias/mongo";
import { CreateSku } from "@/functions/CreateSku";
import { DesignMain, serialize } from "@pythias/backend";
import { notFound } from "next/navigation";
import {designPage} from "@pythias/backend";
import { theme } from "@/components/UI/Theme";
export const dynamic = 'force-dynamic';
export default async function DesignPage({ params }) {
    let { id } = await params;
    if (id) {
        try {
            let {design, blanks, brands, marketPlaces, productImages, licenses, colors, printLocations, genders, seasons, sportUsedFor, themes} = await designPage({
                id,
                Brands,
                LicenseHolders,
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
            });
            console.log(themes, "Themes in DesignPage");
            return (
                <DesignMain design={design} bls={blanks} brands={brands} mPs={marketPlaces} pI={productImages} licenses={licenses} colors={colors} printLocations={printLocations} CreateSku={CreateSku} seas={seasons} gen={genders} source={"simplysage"} them={themes} sport={sportUsedFor} />
            )
        } catch (e) {
            console.log(e)
            return notFound()
        }
    } else {
        return notFound()
    }
}

