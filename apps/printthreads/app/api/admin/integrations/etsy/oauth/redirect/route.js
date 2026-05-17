import { makeEtsyOAuthRedirectGET } from "@pythias/integrations";
export const GET = makeEtsyOAuthRedirectGET({
    redirectUri: "http://localhost:3009/api/admin/integrations/etsy/oauth/redirect",
    provider: "printthreads",
    adminUrl: "http://localhost:3009/admin/integrations",
});
