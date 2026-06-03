import { PlatformProduct, PlatformBlank as Blanks, PlatformColor as Color, Seasons, Genders, SportUsedFor, Brands, PlatformMarketPlace as MarketPlaces, Themes, PrintTypes, PlatformLicenseHolder as LicenseHolders, PlatformUser as User } from "@pythias/mongo";
import { ProductsMain as Main, serialize } from "@pythias/backend";
import { CreateSku } from "@/functions/CreateSku";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage(req) {
    const query = await req.searchParams;
    const page = parseInt(query.page ?? "1");
    const q = query.q ?? null;
    const filters = query.filters ? JSON.parse(query.filters) : {};

    const [headersList, session] = await Promise.all([headers(), getServerSession(authOptions)]);
    const orgId = session?.user?.orgId;

    const [user, blanks, seasons, genders, sportsUsedFor, platformBrands, marketplaces, themes, colors, printTypes, licenses, totalProducts] = await Promise.all([
        User.findOne({ userName: headersList.get("user") }).select("permissions").lean(),
        Blanks.find(orgId ? { orgId } : {}).populate("colors").lean(),
        Seasons.find().lean(),
        Genders.find().lean(),
        SportUsedFor.find().lean(),
        orgId ? Brands.find({ orgId }).sort({ name: 1 }).lean() : [],
        MarketPlaces.find(orgId ? { orgId } : {}).lean(),
        Themes.find().lean(),
        Color.find(orgId ? { orgId } : {}).lean(),
        PrintTypes.find().lean(),
        LicenseHolders.find(orgId ? { orgId } : {}).lean(),
        orgId ? PlatformProduct.countDocuments({ orgId }) : Promise.resolve(0),
    ]);

    const canManageMarketplaces = Boolean(user?.permissions?.marketplaces);

    return (
        <Main
            prods={[]}
            co={0}
            pa={page}
            query={q}
            blanks={serialize(blanks)}
            seasons={serialize(seasons)}
            genders={serialize(genders)}
            sportsUsedFor={serialize(sportsUsedFor)}
            brands={serialize(platformBrands)}
            marketplaces={serialize(marketplaces)}
            themes={serialize(themes)}
            colors={serialize(colors)}
            filter={filters}
            CreateSku={CreateSku}
            source={"simplysage"}
            totalProducts={totalProducts}
            printTypes={serialize(printTypes)}
            licenses={serialize(licenses)}
            canManageMarketplaces={canManageMarketplaces}
            searchUrl="/api/admin/products"
        />
    );
}
