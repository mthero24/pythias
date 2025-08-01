import {Products} from "@pythias/mongo";
import { ProductsMain as Main, serialize, getProducts} from "@pythias/backend";

export const dynamic = 'force-dynamic';
//server components
export default async function ProductsPage(req){
    let query = await req.searchParams
    let page = parseInt(query.page ? query.page : 1)
    let q = query.q ? query.q : null;
    let {products, count} = await getProducts({ Products, page, query: q });
    products = serialize(products);
    return <Main prods={products} co={count} pa={page} q={q} />;
}
