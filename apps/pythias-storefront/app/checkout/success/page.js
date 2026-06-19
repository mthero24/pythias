import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    const t = site.theme || {};
    const storeName = site.name || site.subdomain;
    return (
        <SiteFrame site={site}>
            <section className="sf-container" style={{ paddingTop: 64, paddingBottom: 64, textAlign: "center" }}>
                {/* Seller branding front-and-center on the confirmation */}
                {t.logoUrl
                    ? <img src={t.logoUrl} alt={storeName} style={{ height: Math.max(40, Math.min(96, Number(t.logoHeight) * 1.5 || 56)), width: "auto", margin: "0 auto 12px", display: "block" }} />
                    : <div style={{ fontWeight: 800, fontSize: "1.4rem", fontFamily: "var(--sf-font-heading)", marginBottom: 8 }}>{storeName}</div>}
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--sf-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "8px auto 12px" }}>✓</div>
                <h1 style={{ margin: "0 0 8px" }}>Thank you for your order!</h1>
                <p style={{ opacity: 0.7, marginBottom: 8, maxWidth: 520, marginInline: "auto" }}>
                    Your payment was received and {storeName} is preparing your order. A confirmation has been sent to your email.
                </p>

                <OrderConfirmation />

                <div style={{ marginTop: 28 }}>
                    <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>Continue shopping →</a>
                </div>
            </section>
        </SiteFrame>
    );
}
