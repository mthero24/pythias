"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";

// Social + Microsoft (Bing) advertising pixels.
// Each pixel renders only if its ID is configured via env var, so it's safe to deploy
// before every ID is filled in. Set these in apps/pythias/.env (NEXT_PUBLIC_* so they
// reach the browser):
//   NEXT_PUBLIC_META_PIXEL_ID     — Meta Pixel ID (covers BOTH Facebook and Instagram)
//   NEXT_PUBLIC_TWITTER_PIXEL_ID  — X (Twitter) Pixel ID
//   NEXT_PUBLIC_PINTEREST_TAG_ID  — Pinterest Tag ID
//   NEXT_PUBLIC_LINKEDIN_PARTNER_ID — LinkedIn Insight partner ID
//   NEXT_PUBLIC_TIKTOK_PIXEL_ID   — TikTok Pixel ID
//   NEXT_PUBLIC_MS_UET_TAG_ID     — Microsoft Advertising (Bing) UET tag ID
//
// NOTE on Truth Social: it does not provide a standard JavaScript advertising/retargeting
// pixel (its ad inventory runs through the Rumble Advertising Center), so there is nothing
// to embed here for it. If/when Truth Social ships a pixel, add it as another block below.
const META_PIXEL_ID    = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TWITTER_PIXEL_ID = process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID;
const PINTEREST_TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID;
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;
const TIKTOK_PIXEL_ID  = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const MS_UET_TAG_ID    = process.env.NEXT_PUBLIC_MS_UET_TAG_ID;

export default function TrackingPixels() {
    const pathname = usePathname();
    // Never load ad/retargeting pixels inside the authenticated admin app.
    if (pathname?.startsWith("/admin")) return null;

    return (
        <>
            {/* Meta Pixel — covers Facebook AND Instagram */}
            {META_PIXEL_ID && (
                <>
                    <Script id="meta-pixel" strategy="afterInteractive">{`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window,document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${META_PIXEL_ID}');
                        fbq('track', 'PageView');
                    `}</Script>
                    <noscript>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img height="1" width="1" style={{ display: "none" }} alt=""
                            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
                    </noscript>
                </>
            )}

            {/* X (Twitter) Pixel */}
            {TWITTER_PIXEL_ID && (
                <Script id="twitter-pixel" strategy="afterInteractive">{`
                    !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},
                    s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
                    a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
                    twq('config','${TWITTER_PIXEL_ID}');
                `}</Script>
            )}

            {/* Pinterest Tag */}
            {PINTEREST_TAG_ID && (
                <>
                    <Script id="pinterest-tag" strategy="afterInteractive">{`
                        !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
                        var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;
                        var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
                        pintrk('load', '${PINTEREST_TAG_ID}');
                        pintrk('page');
                    `}</Script>
                    <noscript>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img height="1" width="1" style={{ display: "none" }} alt=""
                            src={`https://ct.pinterest.com/v3/?event=init&tid=${PINTEREST_TAG_ID}&noscript=1`} />
                    </noscript>
                </>
            )}

            {/* LinkedIn Insight Tag */}
            {LINKEDIN_PARTNER_ID && (
                <>
                    <Script id="linkedin-insight" strategy="afterInteractive">{`
                        _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
                        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                        (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
                        var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");
                        b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
                        s.parentNode.insertBefore(b,s);})(window.lintrk);
                    `}</Script>
                    <noscript>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img height="1" width="1" style={{ display: "none" }} alt=""
                            src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`} />
                    </noscript>
                </>
            )}

            {/* TikTok Pixel */}
            {TIKTOK_PIXEL_ID && (
                <Script id="tiktok-pixel" strategy="afterInteractive">{`
                    !function (w, d, t) {
                      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
                      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                      ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                      ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                      ttq.load('${TIKTOK_PIXEL_ID}');
                      ttq.page();
                    }(window, document, 'ttq');
                `}</Script>
            )}

            {/* Microsoft Advertising (Bing) UET tag */}
            {MS_UET_TAG_ID && (
                <Script id="ms-uet" strategy="afterInteractive">{`
                    (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${MS_UET_TAG_ID}", enableAutoSpaTracking: true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},
                    n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},
                    i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
                `}</Script>
            )}
        </>
    );
}
