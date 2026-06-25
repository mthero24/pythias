import { makeEtsyOAuthRedirectGET } from "@pythias/integrations";
export const GET = makeEtsyOAuthRedirectGET({
    redirectUri: process.env.ETSY_REDIRECT_URI || "http://localhost:3006/api/admin/integrations/etsy/oauth/redirect",
    provider: "premierPrinting",
    adminUrl: process.env.ETSY_ADMIN_URL || "http://localhost:3006/admin/integrations",
});
