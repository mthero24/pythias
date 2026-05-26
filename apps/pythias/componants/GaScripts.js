"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function GaScripts() {
    const pathname = usePathname();
    if (pathname?.startsWith("/admin")) return null;

    return (
        <>
            <Script src="https://www.googletagmanager.com/gtag/js?id=G-Q27ZSTSXVH" strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">{`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-Q27ZSTSXVH', { send_page_view: false });
                gtag('config', 'AW-18171939038');
            `}</Script>
        </>
    );
}
