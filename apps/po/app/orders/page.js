import Order from "@/models/Order";
import { OrdersMain } from "@pythias/backend";
import { OrdersSearch } from "@/functions/ordersSearch";

export const dynamic = "force-dynamic";

const ACTIVE_FILTER = {
    status: { $nin: ["Delivered", "Complete", "Canceled", "Payment Failed"] },
};

export default async function OrdersPage(req) {
    const query = await req.searchParams;
    const page = query.page ? parseInt(query.page) : 1;
    const showAll = query.status === "all";
    const q = query.q || null;
    const statusFilter = showAll ? {} : ACTIVE_FILTER;

    const { orders, count } = await OrdersSearch({ Order, q, page, statusFilter });
    const pages = Math.ceil((count || 0) / 50);

    return (
        <OrdersMain
            ords={JSON.parse(JSON.stringify(orders))}
            page={page}
            pages={pages}
            showAll={showAll}
            q={q}
            source="PO"
        />
    );
}
