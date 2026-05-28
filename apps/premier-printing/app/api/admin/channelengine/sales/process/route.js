import { NextResponse } from "next/server";
import { CESale } from "@pythias/mongo";
import { updateOffers, updateChannelOffers } from "@/functions/channelEngine";

// POST /api/admin/channelengine/sales/process
// Called by a cron job (or manually) to activate/end due sales.
export async function POST() {
    try {
        const now = new Date();
        let activated = 0;
        let ended = 0;

        const pushOffers = async (sale, offers) => {
            const chs = sale.channels ?? [];
            if (chs.length > 0) {
                await Promise.allSettled(chs.map(ch => updateChannelOffers(ch.id, offers)));
            } else {
                await updateOffers(offers);
            }
        };

        // Activate scheduled sales whose startDate has passed
        const toActivate = await CESale.find({ status: "scheduled", startDate: { $lte: now } });
        for (const sale of toActivate) {
            try {
                const offers = sale.products.map(p => ({
                    MerchantProductNo: p.merchantProductNo,
                    Price:             parseFloat(p.salePrice.toFixed(2)),
                    ListPrice:         parseFloat(p.originalPrice.toFixed(2)),
                }));
                await pushOffers(sale, offers);
                sale.status      = "active";
                sale.activatedAt = now;
                await sale.save();
                activated++;
            } catch (e) {
                console.error(`[ce/sales/process] Failed to activate sale ${sale._id}:`, e.message);
            }
        }

        // End active sales whose endDate has passed
        const toEnd = await CESale.find({ status: "active", endDate: { $lte: now } });
        for (const sale of toEnd) {
            try {
                const offers = sale.products.map(p => ({
                    MerchantProductNo: p.merchantProductNo,
                    Price:             parseFloat(p.originalPrice.toFixed(2)),
                    ListPrice:         0,
                }));
                await pushOffers(sale, offers);
                sale.status  = "ended";
                sale.endedAt = now;
                await sale.save();
                ended++;
            } catch (e) {
                console.error(`[ce/sales/process] Failed to end sale ${sale._id}:`, e.message);
            }
        }

        return NextResponse.json({ error: false, activated, ended });
    } catch (e) {
        console.error("[channelengine/sales/process]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
