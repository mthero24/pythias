import { Products, Blank as Blanks, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, Inventory, PrintTypes, LicenseHolders, User } from "@pythias/mongo";
import { ProductsMain as Main, serialize, getProducts, } from "@pythias/backend";
import { CreateSku } from "@/functions/CreateSku";
import { headers } from "next/headers";
export const dynamic = 'force-dynamic';
//server components
export default async function ProductsPage(req) {
    let query = await req.searchParams
    let page = parseInt(query.page ? query.page : 1)
    let q = query.q ? query.q : null;
    let filters = {};
    try { if (query.filters) filters = JSON.parse(query.filters); } catch {}
    const headersList = await headers();
    const user = await User.findOne({ userName: headersList.get("user") }).select("permissions").lean();
    const canManageMarketplaces = Boolean(user?.permissions?.marketplaces);
    let { products, count, blanks, seasons, genders, sportsUsedFor, brands, marketplaces, themes, colors, totalProducts, printTypes, licenses } = await getProducts({ Products, Blanks, Seasons, Genders, SportUsedFor, Brands, MarketPlaces, Themes, Color, PrintTypes, LicenseHolders, page, query: q, filters, Inventory });
    products = serialize(products);
    blanks = serialize(blanks);
    seasons = serialize(seasons);
    genders = serialize(genders);
    sportsUsedFor = serialize(sportsUsedFor);
    brands = serialize(brands);
    marketplaces = serialize(marketplaces);
    themes = serialize(themes);
    colors = serialize(colors);
    printTypes = serialize(printTypes);
    licenses = serialize(licenses);
    return <Main prods={products} co={count} pa={page} query={q} blanks={blanks} seasons={seasons} genders={genders} sportsUsedFor={sportsUsedFor} brands={brands} marketplaces={marketplaces} themes={themes} colors={colors} filter={filters} CreateSku={CreateSku} source={"simplysage"} totalProducts={totalProducts} printTypes={printTypes} licenses={licenses} canManageMarketplaces={canManageMarketplaces}/>;
}