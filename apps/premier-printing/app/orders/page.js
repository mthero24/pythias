import { Order, Item } from "@pythias/mongo";
import { OrdersMain } from "@pythias/backend";
import { serialize } from "@/functions/serialize";
import { OrdersSearch, ORDERS_PER_PAGE } from "@/functions/ordersSearch";
export const dynamic = "force-dynamic";
import "@/functions/pullOrders";

export default async function OrdersPage(req) {
    const query = await req.searchParams;
    const page = query.page ? parseInt(query.page) : 1;
    const showAll = query.status === "all";
    const q = query.q || null;
    const statusFilter = showAll ? {} : { status: "awaiting_shipment" };

    let orderIds = null;
    if (query.filter === "blank") {
        orderIds = await Item.find({ isBlank: true }).select("order").distinct("order");
    } else if (query.filter === "missinginfo") {
        orderIds = await Item.find({
            $or: [
                { colorName: { $in: [null, ""] } },
                { sizeName: { $in: [null, ""] } },
                { design: { $in: [null, ""] }, isBlank: false },
                { styleCode: { $in: [null, ""] } },
            ],
        }).select("order").distinct("order");
    }

    const { orders, count } = await OrdersSearch({ Order, q, page, statusFilter, orderIds });
    const pages = Math.ceil(count / ORDERS_PER_PAGE);

    return (
        <OrdersMain
            ords={serialize(orders)}
            page={page}
            pages={pages}
            filter={query.filter}
            showAll={showAll}
            q={q}
        />
    );
}
