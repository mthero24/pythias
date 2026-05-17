import { makeEtsyOAuthRedirectGET } from "@pythias/integrations";
export const GET = makeEtsyOAuthRedirectGET({
    redirectUri: "http://localhost:3008/api/admin/integrations/etsy/oauth/redirect",
    provider: "pythias-test",
    adminUrl: "http://localhost:3008/admin/integrations",
});
