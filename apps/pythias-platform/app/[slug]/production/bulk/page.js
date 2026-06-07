import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformOrder, Organization, Settings } from "@pythias/mongo";
import mongoose from "mongoose";
import { serialize } from "@pythias/backend";
import { BulkMain } from "@pythias/labels";

export const dynamic = "force-dynamic";

export default async function BulkOrdersPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = new mongoose.Types.ObjectId(session.user.orgId);

    const [org, orders, printersDoc, picklistDoc] = await Promise.all([
        Organization.findById(orgId).lean(),
        PlatformOrder.find({
            orgId,
            bulk: true,
            bulkPrinted: { $in: [false, null] },
            cancelled: false,
            status: { $nin: ["Canceled", "returned", "shipped", "Shipped", "Delivered", "payment failed", "Payment Failed"] },
        })
            .populate("items")
            .lean(),
        Settings.findOne({ key: "productionLabelPrinters" }).lean(),
        Settings.findOne({ key: "picklistLabelPrinters" }).lean(),
    ]);
    const printers          = (() => { try { return JSON.parse(printersDoc?.value ?? "[]");        } catch { return []; } })();
    const picklistPrinters  = (() => { try { return JSON.parse(picklistDoc?.value  ?? "[]");       } catch { return []; } })();

    if (!org) redirect("/login");

    const bulkThreshold = org.settings?.bulkThreshold ?? 5;

    // Attach shippingType from order to each item, and ensure bulkId is set
    const shaped = orders.map(order => ({
        ...order,
        items: (order.items || [])
            .filter(item => !item.cancelled)
            .map(item => ({
                ...item,
                shippingType: order.shippingType,
                bulkId: item.bulkId || order.poNumber,
                stockStatus: item.stockStatus || "inStock",
                canceled: item.cancelled,
            })),
    }));

    return <BulkMain orders={serialize(shaped)} bulkThreshold={bulkThreshold} printers={printers} picklistPrinters={picklistPrinters} />;
}
