import { Item, Inventory, Blank as Blanks } from "@pythias/mongo";
import {serialize} from "@/functions/serialize";
import {Main} from "@pythias/inventory";
import {getInv} from "@pythias/inventory"
export const dynamic = 'force-dynamic'; 
export default async function InventoryPage (req){
    let search = await req.searchParams;
    let page = search.page;
    let term = search.q;
    console.log(page, term, "search params in inventory page");
    if (page) {
        page = parseInt(page)
    } else page = 1
    let res = await getInv({ Blanks, Inventory, term, page })
    let combined = serialize(res.blanks)
    return <Main bla={combined} it={[]} defaultLocation={"utah"} binType="row" pagination={true} cou={res.count} pa={page} q={term}/>
}