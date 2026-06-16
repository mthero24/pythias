import { Inventory } from "@pythias/mongo";
import Blanks from "@/models/StyleV2";
import { serialize } from "@pythias/backend";
import { Main, getInv } from "@pythias/inventory";
import ReconcileButton from "./ReconcileButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }) {
    const search = await searchParams;
    const term   = search.q;
    const page   = search.page ? parseInt(search.page) : 1;

    const [res, allInventory, allBlanks] = await Promise.all([
        getInv({ Blanks, Inventory, term, page }),
        Inventory.find({ quantity: { $gt: 0 } }).select("quantity style_code size_name").lean(),
        Blanks.find({}).select("code sizes").lean(),
    ]);

    const blankSizeMap = {};
    for (const b of allBlanks) {
        blankSizeMap[b.code] = {};
        for (const s of b.sizes ?? []) {
            blankSizeMap[b.code][s.name] = s.cost || s.wholesaleCost || 0;
        }
    }
    const totalValue = allInventory.reduce((sum, i) => {
        const cost = blankSizeMap[i.style_code]?.[i.size_name] ?? 0;
        return sum + cost * i.quantity;
    }, 0);

    return (
        <>
            <ReconcileButton />
            <Main
                bla={serialize(res.blanks)}
                it={[]}
                defaultLocation="Ohio"
                binType="location"
                pagination={true}
                cou={res.count}
                pa={page}
                q={term}
                totalValue={totalValue}
            />
        </>
    );
}
