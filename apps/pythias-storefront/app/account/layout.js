import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { themeVars } from "@pythias/storefront";

export const dynamic = "force-dynamic";

// Apply the store's palette to the whole account area so it follows the site's colors (accent buttons,
// tabs, links, background/text). Account pages render their own AccountShell (no SiteFrame), so the
// theme vars wouldn't otherwise be set here.
export default async function AccountLayout({ children }) {
    const site = await resolveSite((await headers()).get("host")).catch(() => null);
    const vars = themeVars(site?.theme || {});
    return (
        <div style={{ ...vars, background: "var(--sf-bg)", color: "var(--sf-text)", minHeight: "100vh", fontFamily: "var(--sf-font-body)" }}>
            {children}
        </div>
    );
}
