export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSite, Organization } from "@pythias/mongo";
import { storefront } from "@pythias/backend/server";
import { sendEmail } from "@/lib/email";

// POST /api/internal/analytics/weekly-report — emails each storefront seller their 7-day
// analytics digest. Run weekly by PM2. Shared-secret guarded.
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export async function POST(req) {
    if (!process.env.PYTHIAS_INTERNAL_KEY || req.headers.get("x-pythias-internal-key") !== process.env.PYTHIAS_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sites = await StorefrontSite.find({ status: "published" }).select("orgId name").limit(2000).lean();
    let sent = 0, skipped = 0;
    for (const site of sites) {
        try {
            const s = await storefront.analyticsSummary(site.orgId, "7d");
            if (!s.overview.sessions) { skipped++; continue; }
            const org = await Organization.findById(site.orgId).select("billingEmail name").lean();
            if (!org?.billingEmail) { skipped++; continue; }
            const o = s.overview;
            const top = (s.products || []).slice(0, 3).map((p) => `<li>${p.title} — ${p.views} views, ${p.purchasedUnits} sold</li>`).join("");
            const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2>${site.name || org.name} — your week</h2>
                <p>${o.visitors} visitors · ${o.sessions} sessions · <b>${o.conversions} orders</b> · <b>${money(o.revenueCents)}</b></p>
                <p>Conversion rate ${o.conversionRate}% · bounce ${o.bounceRate}% · avg session ${o.avgDurationSec}s</p>
                ${top ? `<h3>Top products</h3><ul>${top}</ul>` : ""}
                <p style="color:#64748b;font-size:12px">Sent by Pythias. Full analytics in your dashboard.</p>
            </div>`;
            const r = await sendEmail({ to: org.billingEmail, subject: `Your weekly store report — ${money(o.revenueCents)} in sales`, html });
            if (r?.ok !== false) sent++; else skipped++;
        } catch { skipped++; }
    }
    return NextResponse.json({ error: false, sent, skipped, sites: sites.length });
}
