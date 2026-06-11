import { Inventory, Blank as Blanks, Settings } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Main, getInv } from "@pythias/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryPage(req) {
    const search = await req.searchParams;
    const term   = search.q;
    const page   = search.page ? parseInt(search.page) : 1;

    const [res, allInventory, allBlanks, sanmarConn, ssConn] = await Promise.all([
        getInv({ Blanks, Inventory, term, page }),
        Inventory.find({ quantity: { $gt: 0 } }).select("quantity style_code size_name").lean(),
        Blanks.find({}).select("code sizes").lean(),
        Settings.findOne({ key: "sanmar.connected" }).lean(),
        Settings.findOne({ key: "ssactivewear.connected" }).lean(),
    ]);
    const sanmarConnected = sanmarConn?.value === "true";
    const ssConnected     = ssConn?.value     === "true";

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
        <Main
            bla={serialize(res.blanks)}
            it={[]}
            defaultLocation="utah"
            binType="row"
            pagination={true}
            cou={res.count}
            pa={page}
            q={term}
            totalValue={totalValue}
            sanmarConnected={sanmarConnected}
            ssConnected={ssConnected}
        />
    );
}
