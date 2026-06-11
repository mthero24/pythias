import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformOrder, PlatformItem } from "@pythias/mongo";
import { OrdersMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

const ORDERS_PER_PAGE = 50;

export default async function OrdersPage(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = session.user.orgId;
    const query = await req.searchParams;
    const page = query.page ? parseInt(query.page) : 1;
    const showAll = query.status === "all";
    const q = query.q || null;
    const statusFilter = showAll ? {} : { status: "awaiting_shipment" };

    let matchFilter = { orgId, ...statusFilter };
    let orderIds = null;

    if (query.filter === "blank") {
        orderIds = await PlatformItem.find({ orgId, isBlank: true }).distinct("order");
    } else if (query.filter === "missinginfo") {
        orderIds = await PlatformItem.find({
            orgId,
            custom: { $ne: true },
            $or: [
                { colorName: { $in: [null, ""] } },
                { sizeName: { $in: [null, ""] } },
                { designRef: { $in: [null, ""] }, isBlank: false },
                { styleCode: { $in: [null, ""] } },
            ],
        }).distinct("order");
    }

    if (orderIds) matchFilter._id = { $in: orderIds };

    let orders, count;
    if (q) {
        const qFilter = {
            ...matchFilter,
            $or: [
                { poNumber: { $regex: q, $options: "i" } },
                { orderId: { $regex: q, $options: "i" } },
            ],
        };
        [orders, count] = await Promise.all([
            PlatformOrder.find(qFilter)
                .sort({ _id: -1 })
                .skip((page - 1) * ORDERS_PER_PAGE)
                .limit(ORDERS_PER_PAGE)
                .populate("items")
                .lean(),
            PlatformOrder.countDocuments(qFilter),
        ]);
    } else {
        [orders, count] = await Promise.all([
            PlatformOrder.find(matchFilter)
                .sort({ _id: -1 })
                .skip((page - 1) * ORDERS_PER_PAGE)
                .limit(ORDERS_PER_PAGE)
                .populate("items")
                .lean(),
            PlatformOrder.countDocuments(matchFilter),
        ]);
    }

    const pages = Math.ceil(count / ORDERS_PER_PAGE);

    return (
        <OrdersMain
            ords={JSON.parse(JSON.stringify(orders))}
            page={page}
            pages={pages}
            filter={query.filter}
            showAll={showAll}
            q={q}
        />
    );
}
