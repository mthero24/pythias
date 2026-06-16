import { StorefrontWelcome } from "@pythias/backend/storefront";
import { STOREFRONT_PLANS, PLAN_ORDER } from "@/lib/storefrontPlans";

export const dynamic = "force-dynamic";

// "Learn about Storefront" — shared explainer + pricing (same component the fulfiller app uses).
// Subscribable here: plan buttons start Stripe checkout. Plans come from the billing lib so the
// displayed prices always match what we charge.
export default function StorefrontWelcomePage() {
    const plans = PLAN_ORDER.map((k) => {
        const { key, name, monthlyCents, blurb, features, popular, includedStores, extraStoreCents } = STOREFRONT_PLANS[k];
        return { key, name, monthlyCents, blurb, features, popular: !!popular, includedStores, extraStoreCents };
    });
    return <StorefrontWelcome plans={plans} subscribable />;
}
