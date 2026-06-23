import { PlatformProduct, PlatformBlank as Blanks, PlatformColor as Color, Brands, PlatformMarketPlace as MarketPlaces, PlatformEditData, PlatformLicenseHolder as LicenseHolders, Organization } from "@pythias/mongo";
import { ProductsMain as Main, serialize } from "@pythias/backend";
import { CreateSku } from "@/functions/CreateSku";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage(req) {
    const query = await req.searchParams;
    const page = parseInt(query.page ?? "1");
    const q = query.q ?? null;
    const filters = query.filters ? JSON.parse(query.filters) : {};

    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    const orgSlug = session?.user?.orgSlug;

    // One-off taxonomy + print types are org-scoped in PlatformEditData — for Commerce Cloud
    // these are inherited from Premier by the catalog sync (no per-seller Edit Data screen).
    // Print types carry a price that flows into product build pricing.
    const [blanks, editData, platformBrands, marketplaces, colors, licenses, totalProducts] = await Promise.all([
        Blanks.find(orgId ? { orgId } : {}).populate("colors").lean(),
        orgId ? PlatformEditData.find({ orgId }).lean() : [],
        orgId ? Brands.find({ orgId }).sort({ name: 1 }).lean() : [],
        MarketPlaces.find(orgId ? { orgId } : {}).lean(),
        Color.find(orgId ? { orgId } : {}).lean(),
        LicenseHolders.find(orgId ? { orgId } : {}).lean(),
        orgId ? PlatformProduct.countDocuments({ orgId }) : Promise.resolve(0),
    ]);
    const org = orgId ? await Organization.findById(orgId).select("orgType").lean() : null;
    const orgType = org?.orgType || "fulfillment";
    const byType = (t) => editData.filter((d) => d.type === t);
    const seasons = byType("seasons");
    const genders = byType("genders");
    const sportsUsedFor = byType("sportUsedFor");
    const themes = byType("themes");
    const printTypes = byType("printTypes");

    const canManageMarketplaces = Boolean(session?.user?.permissions?.marketplaces) || ["admin", "owner"].includes(session?.user?.role);

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
            source={orgSlug || "platform"}
            totalProducts={totalProducts}
            printTypes={serialize(printTypes)}
            licenses={serialize(licenses)}
            canManageMarketplaces={canManageMarketplaces}
            searchUrl="/api/admin/products"
            orgId={orgId}
            orgType={orgType}
        />
    );
}
