import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ContactMessage, LeadSequence } from "@pythias/mongo";
import { sendInternalAlert } from "@/lib/email";

// AI concierge for the Pythias marketing site. Answers buyer questions, and when a visitor
// is a real prospect it asks for their email — the moment they give it, we save the lead +
// email Michael the full transcript so he can follow up personally.

const SYSTEM = `You are the Pythias AI assistant on pythiastechnologies.com — friendly, sharp, and genuinely helpful. You help print shops and product sellers figure out if Pythias is right for them.

ABOUT PYTHIAS
Pythias is one platform that runs a print/fulfillment operation end to end — it pulls orders from every sales channel into one production queue, automates shipping labels, tracks inventory, and gives one dashboard for the whole business. Founder: Michael Thero, who built the system that helped a shop grow from $1M to $10M a year.

THREE PRODUCTS
- Fulfillment Cloud — for shops that OWN production equipment (DTG, DTF, embroidery, sublimation, screen print). Production queues by print type, auto shipping labels (USPS/FedEx/UPS) at barcode scan, blank inventory with AI reorder forecasting, team management, analytics. From $199/mo, NO per-order fees.
- Commerce Cloud — for sellers WITHOUT equipment. List products across channels; orders route to vetted fulfillment partners who print and ship. Free plan; paid from $79/mo + a transparent margin fee.
- Storefront Cloud — an AI-built online store (a Shopify replacement). Describe your store and AI builds it; checkout flows straight into fulfillment. From $49/mo.

KEY FACTS
- Connects natively to 18+ marketplaces (Amazon, Walmart, Etsy, TikTok Shop, Shopify, eBay, Faire, and more), 200+ via Mirakl/Acenda.
- Barcode scan-to-print and scan-to-ship; labels print automatically.
- AI inventory forecasting from past orders; AI artwork upscaling.
- Onboarding: a week of remote onboarding done with you (or on-site for more). With the founding offer, Michael does it personally.
- FOUNDING OFFER: the first 10 shops to sign up get 25% off for life + free onboarding from Michael himself. Link: pythiastechnologies.com/founding.

HOW TO BEHAVE
- Answer questions accurately and concisely (2-4 sentences). Be warm, not salesy.
- Never invent features or specific prices beyond what's above. If you're unsure, say so and offer to connect them with Michael.
- When the visitor shows real interest (asks about fit, pricing, switching, a demo) or asks something you can't fully answer, OFFER to have Michael (the founder) follow up personally and ASK for their name and the best email to reach them. Keep it natural — answer first, then offer the handoff.
- Mention the founding offer when it's genuinely relevant.
- If they're clearly a fit, nudge them toward /founding or leaving their email.`;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ reply: "Hi! Ask me anything about Pythias." });
        }

        // Keep the last 16 turns, clamp content, normalize roles.
        const convo = messages.slice(-16).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || "").slice(0, 2000),
        })).filter((m) => m.content);

        const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const resp = await ai.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 400,
            system: SYSTEM,
            messages: convo,
        });
        const reply = (resp.content || []).map((b) => b.text || "").join("").trim()
            || "Sorry, could you say that another way?";

        // Real-lead trigger: the visitor's latest message contains an email → capture + alert Michael.
        const lastUser = [...convo].reverse().find((m) => m.role === "user");
        const email = lastUser?.content?.match(EMAIL_RE)?.[0];
        if (email) {
            const transcript = convo
                .map((m) => `${m.role === "user" ? "Visitor" : "Pythias"}: ${m.content}`)
                .join("\n");
            // Fire-and-forget so the chat reply is never blocked or failed by lead handling.
            (async () => {
                try {
                    await ContactMessage.create({
                        name: email,
                        email,
                        message: `AI chat lead — real question/interest from the website assistant:\n\n${transcript}`,
                        source: "ai_chat",
                    });
                    const existing = await LeadSequence.findOne({ email: email.toLowerCase() });
                    if (!existing) {
                        await LeadSequence.create({
                            email: email.toLowerCase(), name: email, source: "ai_chat", step: 0, nextSendAt: new Date(),
                        });
                    }
                    await sendInternalAlert({ name: "AI Chat Visitor", email, company: "", message: transcript, source: "ai_chat" });
                } catch (e) {
                    console.error("[chat lead]", e.message);
                }
            })();
        }

        return NextResponse.json({ reply, captured: Boolean(email) });
    } catch (err) {
        console.error("[api/chat]", err.message);
        return NextResponse.json({
            reply: "Sorry — I hit a snag on my end. You can reach the team at info@pythiastechnologies.com, or grab a founding spot at pythiastechnologies.com/founding.",
        });
    }
}
