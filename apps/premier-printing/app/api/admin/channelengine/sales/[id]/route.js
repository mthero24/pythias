import { NextResponse } from "next/server";
import { CESale } from "@pythias/mongo";
import { updateOffers } from "@/functions/channelEngine";

// DELETE /api/admin/channelengine/sales/[id] — cancel a sale and restore original prices
export async function DELETE(req, { params }) {
    try {
        const sale = await CESale.findById(params.id);
        if (!sale) return NextResponse.json({ error: true, msg: "Sale not found" }, { status: 404 });
        if (sale.status === "ended" || sale.status === "cancelled")
            return NextResponse.json({ error: true, msg: `Sale is already ${sale.status}` }, { status: 400 });

        // If it was active, restore original prices in CE
        if (sale.status === "active") {
            const offers = sale.products.map(p => ({
                MerchantProductNo: p.merchantProductNo,
                Price:             parseFloat(p.originalPrice.toFixed(2)),
                ListPrice:         0,
            }));
            await updateOffers(offers);
        }

        sale.status      = "cancelled";
        sale.cancelledAt = new Date();
        await sale.save();

        return NextResponse.json({ error: false, sale });
    } catch (e) {
        console.error("[channelengine/sales DELETE]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
