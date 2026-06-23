import { PlatformProductInventory as ProductInventory, PlatformDesign as Design, PlatformBlank as Blank, OrgIntegrations, PlatformProduct } from "@pythias/mongo";
import { ProductMain } from "@pythias/inventory";
import { serialize, CatalogInventory } from "@pythias/backend";
import InventoryTabs from "./InventoryTabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ProductInventoryPage({ searchParams }) {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    let { q, page, filter } = await searchParams;
    if (!page) page = 1;

    const [blanksRaw, valueItems, ebayConnCount] = await Promise.all([
        Blank.find({ orgId }).select("code colors sizes").populate("colors").lean(),
        ProductInventory.find({ orgId, quantity: { $gt: 0 }, delete: { $ne: true } })
            .select("quantity blankCode sizeName")
            .lean(),
        OrgIntegrations.countDocuments({ orgId, type: "ebay" }),
    ]);

    const blankSizeMap = {};
    for (const b of blanksRaw) {
        blankSizeMap[b.code] = {};
        for (const s of b.sizes ?? []) {
            blankSizeMap[b.code][s.name] = s.cost || s.wholesaleCost || 0;
        }
    }
    const totalValue = valueItems.reduce((sum, i) => {
        const cost = blankSizeMap[i.blankCode]?.[i.sizeName] ?? 0;
        return sum + cost * i.quantity;
    }, 0);

    const blanks = serialize(blanksRaw);

    // Catalog (buy-not-build / imported) products track stock on the variant, not PlatformInventory —
    // surface them here too so "added products" show up on the inventory page.
    const catalogProducts = await PlatformProduct.find({ orgId, isCatalogProduct: true })
        .select("title variantsArray source").sort({ _id: -1 }).lean();

    const parsed = filter ? JSON.parse(filter) : {};
    const find = { orgId };
    if (parsed.blank) find.blankCode = parsed.blank;
    if (parsed.color) find.colorName = parsed.color;
    if (parsed.size)  find.sizeName  = parsed.size;
    if (q) {
        find.$or = [
            { sku: { $regex: q, $options: "i" } },
            { designSku: { $regex: q, $options: "i" } },
        ];
    }

    let inventory = await ProductInventory.find(find).populate("blank color").sort({ quantity: -1 }).skip((page - 1) * 50).limit(50);
    const totalCount = await ProductInventory.countDocuments(find);
    filter = parsed;

    inventory = await Promise.all(inventory.map(async i => {
        const size   = i.blank?.sizes.find(s => s._id.toString() === i.size?.toString() || s.name === i.sku.split("_")[2]);
        const design = await Design.findOne({ orgId, sku: i.sku.split("_").slice(3).join("_") });
        return { sku: i.sku, _id: i._id, quantity: i.quantity, location: i.location ?? "", blank: i.blank, color: i.color, size, design };
    }));

    return (
        <InventoryTabs
            boughtCount={catalogProducts.length}
            made={
                <ProductMain
                    inventory={serialize(inventory)}
                    q={q}
                    totalCount={totalCount}
                    totalValue={totalValue}
                    p={page}
                    blanks={blanks}
                    fils={filter}
                    hasEbay={ebayConnCount > 0}
                />
            }
            bought={
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
                    <CatalogInventory products={serialize(catalogProducts)} />
                </div>
            }
        />
    );
}
