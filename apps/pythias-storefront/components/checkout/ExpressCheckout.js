"use client";
import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";

// One-tap express wallets (Apple Pay / Google Pay / Link / PayPal) via Stripe's Express Checkout Element.
// Deferred-intent mode: no PaymentIntent is created until the buyer taps a wallet, so it works for a
// single picked variant (quick-add modal) or the whole cart without creating throwaway intents.
// Renders nothing when Stripe isn't configured or no wallet is available on the device.

let _stripe;
function getStripe(pk) { if (!pk) return null; if (!_stripe) _stripe = loadStripe(pk); return _stripe; }

export default function ExpressCheckout({ items, amountCents }) {
    const pk = typeof window !== "undefined" ? window.__SF__?.stripePk : null;
    const currency = (typeof window !== "undefined" && window.__SF__?.currency) || "usd";
    const stripePromise = useMemo(() => getStripe(pk), [pk]);
    if (!pk || !stripePromise || !amountCents || amountCents <= 0 || !items?.length) return null;

    return (
        <Elements stripe={stripePromise} options={{ mode: "payment", amount: amountCents, currency }}>
            <Inner items={items} amountCents={amountCents} />
        </Elements>
    );
}

function Inner({ items, amountCents }) {
    const stripe = useStripe();
    const elements = useElements();

    const onShippingAddressChange = async (event) => {
        try {
            const a = event.address || {};
            const d = await fetch("/api/checkout/quote", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, shippingAddress: { city: a.city, state: a.state, zip: a.postal_code, country: a.country } }),
            }).then((r) => r.json());
            if (d.error) return event.reject();
            elements.update({ amount: d.totalCents });
            event.resolve({
                shippingRates: [{ id: "standard", displayName: "Standard shipping", amount: d.shippingCents || 0 }],
                lineItems: [
                    { name: "Subtotal", amount: d.subtotalCents },
                    ...(d.shippingCents ? [{ name: "Shipping", amount: d.shippingCents }] : []),
                    ...(d.taxCents ? [{ name: "Tax", amount: d.taxCents }] : []),
                ],
            });
        } catch { event.reject(); }
    };

    const onConfirm = async (event) => {
        if (!stripe || !elements) return;
        const { error: submitError } = await elements.submit();
        if (submitError) return;

        const sa = event.shippingAddress;
        const ad = sa?.address || {};
        const shippingAddress = sa ? {
            name: sa.name, address1: ad.line1 || "", address2: ad.line2 || "",
            city: ad.city || "", state: ad.state || "", zip: ad.postal_code || "", country: ad.country || "US",
        } : undefined;
        const email = event.billingDetails?.email;

        const d = await fetch("/api/checkout/intent", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, shippingAddress, email }),
        }).then((r) => r.json()).catch(() => null);
        if (!d || d.error) return;

        if (d.free && d.orderId) { window.location.href = "/account/orders"; return; }   // fully covered by rewards/gift card
        elements.update({ amount: d.amountCents || amountCents });   // match the authoritative intent amount
        const { error } = await stripe.confirmPayment({
            elements, clientSecret: d.clientSecret,
            confirmParams: { return_url: `${window.location.origin}/account/orders` }, redirect: "if_required",
        });
        if (!error) window.location.href = "/account/orders";
    };

    return (
        <ExpressCheckoutElement
            onConfirm={onConfirm}
            onShippingAddressChange={onShippingAddressChange}
            options={{ shippingAddressRequired: true, emailRequired: true, shippingRates: [{ id: "standard", displayName: "Standard shipping", amount: 0 }] }}
        />
    );
}
