import { makeEtsyOAuthRedirectGET } from "@pythias/integrations";
export const GET = makeEtsyOAuthRedirectGET({
    redirectUri: "http://localhost:3006/api/admin/integrations/etsy/oauth/redirect",
    provider: "premierPrinting",
    adminUrl: "http://localhost:3006/admin/integrations",
});
