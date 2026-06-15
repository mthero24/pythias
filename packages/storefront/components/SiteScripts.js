// Injects the seller's analytics tags + social pixels + Organization JSON-LD.
// Server-rendered <script> tags; each block renders only when its ID is set.
// IDs come from site.analytics; schema from site.businessInfo. Rendered once per page
// (inside SiteFrame). Product pages add their own Product JSON-LD via productJsonLd().
export default function SiteScripts({ site }) {
    const a = site?.analytics ?? {};
    const orgLd = organizationLd(site);

    return (
        <>
            {a.ga4Id && (
                <>
                    <script async src={`https://www.googletagmanager.com/gtag/js?id=${a.ga4Id}`} />
                    <script dangerouslySetInnerHTML={{ __html:
                        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${a.ga4Id}');` }} />
                </>
            )}

            {a.gtmId && (
                <>
                    <script dangerouslySetInnerHTML={{ __html:
                        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${a.gtmId}');` }} />
                    <noscript dangerouslySetInnerHTML={{ __html:
                        `<iframe src="https://www.googletagmanager.com/ns.html?id=${a.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
                </>
            )}

            {a.metaPixelId && (
                <>
                    <script dangerouslySetInnerHTML={{ __html:
                        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${a.metaPixelId}');fbq('track','PageView');` }} />
                    <noscript dangerouslySetInnerHTML={{ __html:
                        `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${a.metaPixelId}&ev=PageView&noscript=1" alt=""/>` }} />
                </>
            )}

            {a.tiktokPixelId && (
                <script dangerouslySetInnerHTML={{ __html:
                    `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${a.tiktokPixelId}');ttq.page();}(window,document,'ttq');` }} />
            )}

            {a.snapPixelId && (
                <script dangerouslySetInnerHTML={{ __html:
                    `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script',r=t.createElement(s);r.async=!0,r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${a.snapPixelId}');snaptr('track','PAGE_VIEW');` }} />
            )}

            {a.pinterestTagId && (
                <script dangerouslySetInnerHTML={{ __html:
                    `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${a.pinterestTagId}');pintrk('page');` }} />
            )}

            {orgLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
            )}
        </>
    );
}

function siteUrl(site) {
    const cd = site?.customDomain;
    if (cd?.hostname && cd?.status === "active") return `https://${cd.hostname}`;
    return undefined;
}

function organizationLd(site) {
    const b = site?.businessInfo ?? {};
    const name = b.legalName || site?.name || site?.subdomain;
    if (!name) return null;
    const ld = { "@context": "https://schema.org", "@type": "Store", name };
    const url = siteUrl(site);
    if (url) ld.url = url;
    if (b.email) ld.email = b.email;
    if (b.phone) ld.telephone = b.phone;
    const ad = b.address ?? {};
    if (ad.street || ad.city) {
        ld.address = {
            "@type": "PostalAddress",
            streetAddress: ad.street, addressLocality: ad.city,
            addressRegion: ad.state, postalCode: ad.postalCode, addressCountry: ad.country || "US",
        };
    }
    const sameAs = (b.socials ?? []).map((s) => s.url).filter(Boolean);
    if (sameAs.length) ld.sameAs = sameAs;
    return ld;
}

// Product JSON-LD for product detail pages.
export function productJsonLd({ title, description, images = [], price, currency = "USD" }) {
    const ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        image: images.slice(0, 5),
    };
    if (description) ld.description = description;
    if (typeof price === "number" && price > 0) {
        ld.offers = { "@type": "Offer", price: price.toFixed(2), priceCurrency: currency, availability: "https://schema.org/InStock" };
    }
    return ld;
}
