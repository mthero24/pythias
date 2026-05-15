import { ProductInventory, Design, Blank } from "@pythias/mongo";
import { ProductMain, getProductInventory } from "@pythias/inventory";
import { serialize } from "@pythias/backend";

export default async function ProductInventoryPage({ searchParams }) {
    let { q, page, filter } = await searchParams;
    if (!page) page = 1;

    const [blanksRaw, valueItems] = await Promise.all([
        Blank.find({}).select("code colors sizes").populate("colors").lean(),
        ProductInventory.find({ quantity: { $gt: 0 }, delete: { $ne: true } })
            .select("quantity blankCode sizeName")
            .lean(),
    ]);

    // Build blank → sizes cost map
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

    let inventory, totalCount;

    if (q) {
        const { inventories, count } = await getProductInventory({ q, page, filter: filter ? JSON.parse(filter) : null });
        const ids = inventories.map(i => i._id);
        inventory   = await ProductInventory.find({ _id: { $in: ids } }).populate("blank color").sort({ quantity: -1 });
        totalCount  = count;
    } else {
        const parsed = filter ? JSON.parse(filter) : {};
        const find = {};
        if (parsed.blank) find.blankCode = parsed.blank;
        if (parsed.color) find.colorName = parsed.color;
        if (parsed.size)  find.sizeName  = parsed.size;
        inventory   = await ProductInventory.find(find).populate("blank color").sort({ quantity: -1 }).skip((page - 1) * 50).limit(50);
        totalCount  = await ProductInventory.countDocuments(find);
        filter      = parsed;
    }

    inventory = await Promise.all(inventory.map(async i => {
        const size   = i.blank?.sizes.find(s => s._id.toString() === i.size.toString() || s.name === i.sku.split("_")[2]);
        const design = await Design.findOne({ sku: i.sku.split("_").slice(3).join("_") });
        return { sku: i.sku, _id: i._id, quantity: i.quantity, location: i.location ?? "", blank: i.blank, color: i.color, size, design };
    }));

    return (
        <ProductMain
            inventory={serialize(inventory)}
            q={q}
            totalCount={totalCount}
            totalValue={totalValue}
            p={page}
            blanks={blanks}
            fils={filter}
        />
    );
}
