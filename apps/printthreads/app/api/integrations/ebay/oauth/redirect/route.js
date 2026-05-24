import { makeEbayOAuthRedirectGET } from "@pythias/integrations";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3007"}/api/integrations/ebay/oauth/redirect`;
const ADMIN_URL    = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3007"}/admin/integrations`;

export const GET = makeEbayOAuthRedirectGET({
    redirectUri: REDIRECT_URI,
    provider:    "printthreads",
    adminUrl:    ADMIN_URL,
});
