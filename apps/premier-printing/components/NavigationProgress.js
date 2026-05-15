"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
    const [active, setActive] = useState(false);
    const pathname = usePathname();

    // Hide bar when new page renders
    useEffect(() => {
        setActive(false);
    }, [pathname]);

    // Show bar immediately on any internal link click
    useEffect(() => {
        const handle = (e) => {
            const anchor = e.target.closest("a[href]");
            if (!anchor) return;
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
            if (anchor.target === "_blank") return;
            setActive(true);
        };
        document.addEventListener("click", handle);
        return () => document.removeEventListener("click", handle);
    }, []);

    if (!active) return null;

    return (
        <>
            <style>{`
                @keyframes nav-bar {
                    0%   { width: 0%;  opacity: 1; }
                    60%  { width: 75%; opacity: 1; }
                    100% { width: 88%; opacity: 1; }
                }
                @keyframes nav-shimmer {
                    0%   { left: -40%; }
                    100% { left: 120%; }
                }
                .pythias-nav-bar {
                    position: fixed;
                    top: 0; left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
                    z-index: 99999;
                    animation: nav-bar 2.5s cubic-bezier(0.1, 0.4, 0.3, 1) forwards;
                    overflow: hidden;
                }
                .pythias-nav-shimmer {
                    position: absolute;
                    top: 0; height: 100%;
                    width: 40%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
                    animation: nav-shimmer 1.2s ease-in-out infinite;
                }
            `}</style>
            <div className="pythias-nav-bar">
                <div className="pythias-nav-shimmer" />
            </div>
        </>
    );
}
