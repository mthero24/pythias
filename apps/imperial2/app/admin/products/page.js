import { Products } from "@pythias/mongo";
import { ProductsMain as Main } from "@pythias/backend";
import { serialize } from "@pythias/backend";
export const dynamic = 'force-dynamic';
//server components
export default async function ProductsPage() {
    let products = await Products.find().populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    let prods = serialize(products);
    return <Main prods={prods} />
}

