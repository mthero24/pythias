import { Products, Blank as Blanks, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, PrintTypes, LicenseHolders, User } from "@pythias/mongo";
import { ProductsMain as Main, serialize } from "@pythias/backend";
import { CreateSku } from "@/functions/CreateSku";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
export const dynamic = 'force-dynamic';

const getCachedFilterData = unstable_cache(
    async () => {
        const [blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, licenses, printTypes, totalProducts] = await Promise.all([
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
        return {
            blanks:        serialize(blanks),
            seasons:       serialize(seasons),
            genders:       serialize(genders),
            sportsUsedFor: serialize(sportsUsedFor),
            brands:        serialize(brands),
            marketplaces:  serialize(marketplaces),
            themes:        serialize(themes),
            colors:        serialize(colors),
            licenses:      serialize(licenses),
            printTypes:    serialize(printTypes),
            totalProducts,
        };
    },
    ["printthreads-filter-data"],
    { revalidate: 300 }
);

export default async function ProductsPage(req) {
    let query = await req.searchParams;
    let page = parseInt(query.page ?? 1);
    let q = query.q ?? null;
    let filters = query.filters ? JSON.parse(query.filters) : {};
    const headersList = await headers();

    const [user, filterData] = await Promise.all([
        User.findOne({ userName: headersList.get("user") }).select("permissions").lean(),
        getCachedFilterData(),
    ]);

    const canManageMarketplaces = Boolean(user?.permissions?.marketplaces);
    const { blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, licenses, printTypes, totalProducts } = filterData;

    return <Main
        prods={[]} co={0} pa={page} query={q}
        blanks={blanks} seasons={seasons} genders={genders} sportsUsedFor={sportsUsedFor}
        brands={brands} marketplaces={marketplaces} themes={themes} colors={colors}
        filter={filters} CreateSku={CreateSku} source={"printthreads"}
        totalProducts={totalProducts} printTypes={printTypes} licenses={licenses}
        canManageMarketplaces={canManageMarketplaces}
        searchUrl="/api/admin/products/search"
    />;
}
