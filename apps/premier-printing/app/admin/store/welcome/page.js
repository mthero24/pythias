import { StorefrontWelcome } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// "Learn about Storefront" — shared explainer + pricing. Read-only here (no subscribe in the
// fulfiller app); the same component powers the platform's subscribe flow.
export default function StorefrontWelcomePage() {
    return <StorefrontWelcome />;
}
