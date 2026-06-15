export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, StorefrontReturn, StorefrontSubscription, StorefrontSite } from "@pythias/mongo";
import { getAuthedCustomer, trackingUrl } from "@/lib/account";

// POST /api/account/concierge — buyer-facing AI assistant grounded in the customer's OWN live
// order/return/subscription data + the store's policies. Body: { message, history?:[{role,content}] }
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ reply: "Our assistant is offline right now — please use Messages to contact the seller." });

    const body = await req.json().catch(() => ({}));
    const message = body?.message?.toString().trim();
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    const { orgId, customer } = auth;
    const [orders, returns, subs, site] = await Promise.all([
        PlatformOrder.find({ orgId, customerEmail: customer.email }).select("poNumber date status shippingInfo").sort({ date: -1 }).limit(10).lean(),
        StorefrontReturn.find({ orgId, customerId: customer._id }).select("rmaNumber status resolution createdAt").sort({ createdAt: -1 }).limit(10).lean(),
        StorefrontSubscription.find({ orgId, customerId: customer._id }).select("status intervalLabel nextBillingAt").limit(10).lean(),
        StorefrontSite.findOne({ orgId }).select("name businessInfo returns").lean(),
    ]);
    const brand = site?.businessInfo?.legalName || site?.name || "the store";

    // Compact, grounded context for the model.
    const ctx = [];
    ctx.push(`Customer: ${customer.name || customer.email}. Rewards balance: $${((customer.rewardsBalance || 0) / 100).toFixed(2)}.`);
    if (orders.length) ctx.push("Orders:\n" + orders.map((o) => {
        const lbl = (o.shippingInfo?.labels || []).find((l) => l.trackingNumber);
        return `- #${o.poNumber} (${o.date ? new Date(o.date).toLocaleDateString() : "?"}) status: ${o.status}${lbl ? `, tracking ${lbl.trackingNumber} ${trackingUrl(lbl.provider, lbl.trackingNumber)}` : ""}`;
    }).join("\n"));
    if (returns.length) ctx.push("Returns:\n" + returns.map((r) => `- ${r.rmaNumber} (${r.resolution}) status: ${r.status}`).join("\n"));
    if (subs.length) ctx.push("Subscriptions:\n" + subs.map((s) => `- ${s.intervalLabel}, ${s.status}${s.nextBillingAt ? `, next ${new Date(s.nextBillingAt).toLocaleDateString()}` : ""}`).join("\n"));
    ctx.push(`Return policy: ${site?.returns?.enabled === false ? "returns not accepted" : `returns within ${site?.returns?.windowDays ?? 30} days of the order`}.`);

    const system = `You are the friendly customer-support assistant for ${brand}. Answer the customer's question using ONLY the account data and policy below — never invent order numbers, dates, or tracking. Be concise and warm. For returns, point them to the order page (Account → Orders → the order → "Request a return"). For anything you can't resolve from the data, suggest they message the seller via Account → Messages.

CUSTOMER ACCOUNT DATA:
${ctx.join("\n\n")}`;

    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; } catch { return NextResponse.json({ reply: "Our assistant is temporarily unavailable." }); }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const history = Array.isArray(body.history) ? body.history.filter((m) => m?.role && m?.content).slice(-8) : [];
    try {
        const msg = await client.messages.create({
            model: "claude-opus-4-8", max_tokens: 800, system, thinking: { type: "adaptive" },
            messages: [...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })), { role: "user", content: message }],
        });
        const reply = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
        return NextResponse.json({ reply: reply || "I'm not sure — please contact the seller via Messages." });
    } catch (e) {
        return NextResponse.json({ reply: "Sorry, I hit an error. Please try again or message the seller." });
    }
}
