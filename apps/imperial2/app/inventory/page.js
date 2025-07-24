import {Inventory, Blank as Blanks, Items }from "@pythias/mongo";
import {serialize} from "@/functions/serialize";
import {Main} from "@pythias/inventory";
import {getInv} from "@pythias/inventory"
export const dynamic = 'force-dynamic'; 
export default async function InventoryPage (searchParams){
    let search = await searchParams;
    let page = search.page;
    let term = search.q
    if(page){
        page = parseInt(page)
    }else page= 1
    let items = await Items.find({labelPrinted: false, paid: true, canceled: false}).select("colorName sizeName style blank")
    let res = await getInv({Blanks, Inventory, term, page})
    let combined = serialize(res.blanks)
    items = serialize(items)
    return <Main bla={combined} it={items} defaultLocation="Orlando" binType="location" pagination={true} cou={res.count} pa={page} q={term}/>
}