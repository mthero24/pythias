import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { SiteFrame, PolicyView, POLICY_BY_SLUG } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    return siteMetadata({ title: POLICY_BY_SLUG[slug]?.title || "Policy" });
}

export default async function PolicyPage({ params, searchParams }) {
    const { slug } = await params;
    const preview = previewAllowed(await searchParams);
    const live = await resolveSite((await headers()).get("host"));
    if (!live) return <NoSite />;
    const site = withDraft(live, preview);

    const policy = (site.policies ?? []).find((p) => p.slug === slug);
    if (!policy) return notFound();
    // Public visitors only see written policies; in editor preview, show the page (even empty) so it's editable.
    if (!preview && !(policy.body && String(policy.body).trim())) return notFound();

    return (
        <SiteFrame site={site}>
            <PolicyView title={policy.title || POLICY_BY_SLUG[slug]?.title || "Policy"} body={policy.body} />
        </SiteFrame>
    );
}
