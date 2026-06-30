import { StorefrontWelcome } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// "Learn about Storefront" — shared explainer + pricing. The fulfiller app doesn't bill storefronts
// itself, so the tier buttons send people to the Pythias platform to sign up (with ?plan=<key>).
export default function StorefrontWelcomePage() {
    return <StorefrontWelcome signupUrl="https://platform.pythiastechnologies.com/register" />;
}
