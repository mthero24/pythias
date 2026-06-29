import { PayoutsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payouts · Premier Printing" };

// Premier connects its Stripe account here so custom-order invoice payments pay out to it.
export default function PayoutsPage() {
    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>Payouts</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>
                Connect your Stripe account so customers can pay your invoices and the money lands in your bank.
            </p>
            <PayoutsClient />
        </div>
    );
}
