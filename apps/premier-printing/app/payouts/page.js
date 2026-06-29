import { PayoutsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payouts · Premier Printing" };

// Premier connects its Stripe account here so custom-order invoice payments pay out to it.
export default function PayoutsPage() {
    return <PayoutsClient />;
}
