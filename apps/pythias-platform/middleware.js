export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        "/((?!login|register|api/auth|api/orgs|api/partner|api/provider-callback|api/billing/webhook|api/renderImages|api/integrations/shopify|_next/static|_next/image|favicon.ico|robots.js).*)",
    ],
};
