import { baseTemplate, btn } from "@/lib/email";
import { enqueueMessage, storeBaseUrl, unsubscribeUrl } from "@/lib/marketing";

const brandOf = (site) => site?.businessInfo?.legalName || site?.name || "Our Store";
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const transactionalFooter = (brand) => `${brand} · This is a transactional message about your account or order.`;
const marketingFooter = (site, channel, value) =>
    `You're receiving this because you subscribed at ${brandOf(site)}.<br><a href="${unsubscribeUrl(site, channel, value)}" style="color:#94a3b8">Unsubscribe</a>`;

// ── Transactional ────────────────────────────────────────────────────────────

// Thank-you / welcome on account creation.
export async function enqueueWelcome(site, customer) {
    const brand = brandOf(site);
    const html = baseTemplate({
        brand, title: `Welcome${customer.name ? `, ${customer.name.split(" ")[0]}` : ""}! 🎉`,
        contentHtml: `<p>Thanks for creating an account with ${brand}. We're glad you're here.</p>
            <p style="margin:20px 0">${btn(`${storeBaseUrl(site)}/products`, "Start shopping")}</p>`,
        footerHtml: transactionalFooter(brand),
    });
    return enqueueMessage({
        orgId: site.orgId, channel: "email", to: customer.email, customerId: customer._id,
        type: "welcome", category: "transactional", subject: `Welcome to ${brand}`, html,
        dedupeKey: `welcome:${customer._id}`,
    });
}

// Verify email address (token stored on the customer doc).
export async function enqueueVerification(site, customer) {
    if (!customer.emailVerifyToken) return null;
    const brand = brandOf(site);
    const link = `${storeBaseUrl(site)}/api/account/verify?id=${customer._id}&token=${customer.emailVerifyToken}`;
    const html = baseTemplate({
        brand, title: "Confirm your email",
        contentHtml: `<p>Please confirm your email address to finish setting up your account.</p>
            <p style="margin:20px 0">${btn(link, "Verify email")}</p>
            <p style="font-size:12px;color:#94a3b8">If you didn't create this account, you can ignore this email.</p>`,
        footerHtml: transactionalFooter(brand),
    });
    return enqueueMessage({
        orgId: site.orgId, channel: "email", to: customer.email, customerId: customer._id,
        type: "verification", category: "transactional", subject: `Verify your email for ${brand}`, html,
        dedupeKey: `verify:${customer._id}:${customer.emailVerifyToken}`,
    });
}

// Order placed.
export async function enqueueOrderConfirmation(site, { orgId, orderId, poNumber, email, customerId, lines = [], totals = {} }) {
    if (!email) return null;
    const brand = brandOf(site);
    const rows = lines.map((l) => `<tr><td style="padding:6px 0">${l.label} × ${l.qty}</td><td style="padding:6px 0;text-align:right">${money(l.amountCents)}</td></tr>`).join("");
    const html = baseTemplate({
        brand, title: `Order confirmed — #${poNumber}`,
        contentHtml: `<p>Thanks for your order! We've received it and will email you when it ships.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}
              <tr><td style="padding:8px 0;border-top:1px solid #eee"><b>Total</b></td><td style="padding:8px 0;border-top:1px solid #eee;text-align:right"><b>${money(totals.totalCents)}</b></td></tr>
            </table>
            <p>${btn(`${storeBaseUrl(site)}/account/orders/${orderId}`, "View your order")}</p>`,
        footerHtml: transactionalFooter(brand),
    });
    return enqueueMessage({
        orgId, channel: "email", to: email, customerId,
        type: "order_confirmation", category: "transactional", subject: `Your ${brand} order #${poNumber}`, html,
        dedupeKey: `order_confirmation:${orderId}`,
    });
}

// Order status changed (in_production / shipped / delivered).
const STATUS_COPY = {
    in_production: { title: "Your order is being made", body: "Good news — your order is now in production." },
    shipped:       { title: "Your order shipped! 📦", body: "Your order is on its way." },
    delivered:     { title: "Delivered ✅", body: "Your order was delivered. We hope you love it!" },
    cancelled:     { title: "Order cancelled", body: "Your order has been cancelled." },
};
export async function enqueueOrderStatus(site, { orgId, orderId, poNumber, email, customerId, status, trackingUrl }) {
    const copy = STATUS_COPY[status];
    if (!email || !copy) return null;
    const brand = brandOf(site);
    const html = baseTemplate({
        brand, title: copy.title,
        contentHtml: `<p>${copy.body}</p>
            ${trackingUrl ? `<p style="margin:18px 0">${btn(trackingUrl, "Track your package")}</p>` : ""}
            <p>${btn(`${storeBaseUrl(site)}/account/orders/${orderId}`, "View order")}</p>`,
        footerHtml: transactionalFooter(brand),
    });
    return enqueueMessage({
        orgId, channel: "email", to: email, customerId,
        type: "order_status", category: "transactional", subject: `${brand} order #${poNumber}: ${status.replace(/_/g, " ")}`, html,
        dedupeKey: `order_status:${orderId}:${status}`,
    });
}

// Post-delivery: ask the buyer to review what they bought (drives reviews → conversions).
export async function enqueueReviewRequest(site, { orgId, orderId, email, customerId, products = [] }) {
    if (!email || !products.length) return null;
    const brand = brandOf(site);
    const links = products.slice(0, 6).map((p) =>
        `<li style="margin:6px 0">${esc(p.title)} — ${btn(`${storeBaseUrl(site)}/products/${p.id}#review`, "Leave a review")}</li>`
    ).join("");
    const html = baseTemplate({
        brand, title: "How did we do? ⭐",
        contentHtml: `<p>Thanks for your order from ${brand}! Your feedback helps other shoppers and helps us improve.</p>
            <ul style="list-style:none;padding:0;margin:14px 0">${links}</ul>`,
        footerHtml: marketingFooter(site, "email", email),
    });
    return enqueueMessage({
        orgId, channel: "email", to: email, customerId,
        type: "campaign", category: "marketing", subject: `How was your ${brand} order?`, html,
        dedupeKey: `review_request:${orderId}`,
    });
}

// Tiny HTML escaper for interpolated values above.
function esc(s) { return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }

// ── Lifecycle (marketing) ────────────────────────────────────────────────────

export async function enqueueAbandonedCart(site, customer, { discountCode } = {}) {
    const brand = brandOf(site);
    const html = baseTemplate({
        brand, title: "You left something behind 🛒",
        contentHtml: `<p>Your cart is still waiting at ${brand}.</p>
            ${discountCode ? `<p>Here's <b>${discountCode}</b> for a little something off if you finish now.</p>` : ""}
            <p style="margin:18px 0">${btn(`${storeBaseUrl(site)}/cart`, "Return to cart")}</p>`,
        footerHtml: marketingFooter(site, "email", customer.email),
    });
    return enqueueMessage({
        orgId: site.orgId, channel: "email", to: customer.email, customerId: customer._id,
        type: "abandoned_cart", category: "marketing", subject: `Still thinking it over?`, html,
        dedupeKey: `abandoned_cart:${customer._id}:${customer.cartUpdatedAt ? new Date(customer.cartUpdatedAt).getTime() : ""}`,
    });
}

// Deliver the popup signup discount code by email (transactional — they just requested it).
export async function enqueuePopupDiscount(site, { email, code, customerId }) {
    if (!email || !code) return null;
    const brand = brandOf(site);
    const html = baseTemplate({
        brand, title: "Here's your discount 🎁",
        contentHtml: `<p>Thanks for joining ${brand}! Use this code at checkout:</p>
            <p style="font-size:22px;font-weight:800;letter-spacing:1px;margin:16px 0">${code}</p>
            <p>${btn(`${storeBaseUrl(site)}/products`, "Start shopping")}</p>`,
        footerHtml: marketingFooter(site, "email", email),
    });
    return enqueueMessage({
        orgId: site.orgId, channel: "email", to: email, customerId,
        type: "welcome", category: "transactional", subject: `Your ${brand} discount code`, html,
        dedupeKey: `popup_discount:${site.orgId}:${email}:${code}`,
    });
}

export async function enqueueAbandonedSession(site, customer) {
    const brand = brandOf(site);
    const html = baseTemplate({
        brand, title: "Come back and take a look",
        contentHtml: `<p>Thanks for stopping by ${brand}. Here's what's new — come see something you'll love.</p>
            <p style="margin:18px 0">${btn(`${storeBaseUrl(site)}/products`, "Shop now")}</p>`,
        footerHtml: marketingFooter(site, "email", customer.email),
    });
    return enqueueMessage({
        orgId: site.orgId, channel: "email", to: customer.email, customerId: customer._id,
        type: "abandoned_session", category: "marketing", subject: `We saved your spot at ${brand}`, html,
        dedupeKey: `abandoned_session:${customer._id}:${customer.lastSeenAt ? new Date(customer.lastSeenAt).toISOString().slice(0, 10) : ""}`,
    });
}
