import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <section className="sf-container" style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
                <h1 style={{ margin: "0 0 8px" }}>Thank you for your order!</h1>
                <p style={{ opacity: 0.7, marginBottom: 24 }}>
                    Your payment was received and your order is being prepared. A confirmation has been sent to your email.
                </p>
                <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>Continue shopping →</a>
            </section>
        </SiteFrame>
    );
}
