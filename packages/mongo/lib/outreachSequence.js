// Founder cold-email outreach sequence — shared definition (copy + cadence).
// 5 steps; intervalDaysFromPrev is days AFTER the previous send the step should fire.
// step1=0 (immediate), then +3, +4, +5, +6 → lands on days 0 / 3 / 7 / 12 / 18.
//
// Body copy uses tokens: {{firstName}} ("there" if empty), {{shopName}}, {{link}}, {{unsub}}.
// The body is rendered as plain paragraphs (split on blank lines / single newlines) by the
// React Email template (emails/OutreachEmail.jsx).

export const OUTREACH_LINK = "https://pythiastechnologies.com/founding";

export const OUTREACH_SEQUENCE = [
    {
        step: 1,
        intervalDaysFromPrev: 0,
        subject: "{{shopName}} — 60% more output, same crew",
        body: `Hi {{firstName}},

I'll keep this short — I know you're slammed.

I spent the last few years building the software a print-fulfillment shop runs their entire floor on. Orders from Amazon, Etsy, TikTok, Shopify — 18+ channels — flow into one production queue, shipping labels generate themselves, tracking syncs back. Same team, ~60% more throughput, and a perfect on-time record.

I came up in this industry — I built TShirtPalace's site and watched them go from about $1M to $10M — so I built this the way I'd want it if I were running {{shopName}} myself.

I'm opening 10 founding spots: 25% off for life, and I personally get you set up. Worth a 20-minute look?

{{link}}

— Michael, Pythias Technologies`,
    },
    {
        step: 2,
        intervalDaysFromPrev: 3,
        subject: "Re: {{shopName}} — quick thought",
        body: `Hi {{firstName}},

Floating this back up. One thing I've learned watching shops scale: it's almost never a production problem — it's an operations problem. The orders, inventory, marketplaces, shipping — all held together with spreadsheets.

Pythias puts all of it in one place so your team prints instead of doing data entry.

Open to a quick look? 15 minutes and I'll show you your exact workflow.

— Michael`,
    },
    {
        step: 3,
        intervalDaysFromPrev: 4,
        subject: "what 20 minutes looks like",
        body: `Hi {{firstName}},

No pitch — here's exactly what I'd show you:

• Your Amazon / Etsy / TikTok orders landing in one queue, sorted by deadline
• Labels + tracking generating automatically — no manual entry
• Your team seeing exactly what to print next

The shop I mentioned cut hours of daily admin and hit a perfect on-time record with the same crew.

Want me to set up a quick screen-share?

— Michael`,
    },
    {
        step: 4,
        intervalDaysFromPrev: 5,
        subject: "founding spots",
        body: `Hi {{firstName}},

Quick one — the founding cohort (25% off for life + I personally onboard you) is capped at the first 10 shops, and they're going.

If you've been on the fence, now's the time to grab a look so you don't miss the lifetime rate.

20 minutes?

{{link}}

— Michael`,
    },
    {
        step: 5,
        intervalDaysFromPrev: 6,
        subject: "closing the loop",
        body: `Hi {{firstName}},

I'll stop here — I don't want to clutter your inbox.

If marketplace orders and manual shipping ever become the bottleneck, my door's open: {{link}}. And if now's just not the time, I completely understand.

Either way, wishing you and {{shopName}} a great rest of the year.

— Michael`,
    },
];

export const OUTREACH_TOTAL_STEPS = OUTREACH_SEQUENCE.length;

// Step objects are 1-indexed by `.step`; fetch by step number (1..5).
export function getStep(stepNumber) {
    return OUTREACH_SEQUENCE.find((s) => s.step === stepNumber) || null;
}

// Replace {{tokens}} in a string. firstName falls back to "there".
export function fillTokens(str, { firstName, shopName, link, unsub } = {}) {
    if (!str) return "";
    return str
        .replace(/\{\{firstName\}\}/g, (firstName && String(firstName).trim()) || "there")
        .replace(/\{\{shopName\}\}/g, shopName || "your shop")
        .replace(/\{\{link\}\}/g, link || OUTREACH_LINK)
        .replace(/\{\{unsub\}\}/g, unsub || "");
}

// Given the step just sent, compute the Date the NEXT step is due (null if sequence is done).
export function nextSendDate(justSentStep, from = new Date()) {
    const next = getStep(justSentStep + 1);
    if (!next) return null;
    const d = new Date(from);
    d.setDate(d.getDate() + (next.intervalDaysFromPrev || 0));
    return d;
}
