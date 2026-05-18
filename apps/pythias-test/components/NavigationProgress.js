"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
    const [active, setActive] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setActive(false);
    }, [pathname]);

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

    useEffect(() => {
        const on  = () => setActive(true);
        const off = () => setActive(false);
        window.addEventListener("pythias:loader:start", on);
        window.addEventListener("pythias:loader:stop",  off);
        window.addEventListener("beforeunload", on);
        return () => {
            window.removeEventListener("pythias:loader:start", on);
            window.removeEventListener("pythias:loader:stop",  off);
            window.removeEventListener("beforeunload", on);
        };
    }, []);

    if (!active) return null;

    return (
        <>
            <style>{`
                @keyframes pt-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes pt-glisten {
                    0%   { left: -80%; }
                    100% { left: 140%; }
                }
                @keyframes pt-pulse {
                    0%, 100% { opacity: 0.9;  transform: scale(1);    }
                    50%       { opacity: 1;    transform: scale(1.04); }
                }
                @keyframes pt-bar {
                    0%   { width: 0%;  }
                    60%  { width: 72%; }
                    100% { width: 88%; }
                }
                .pt-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(20, 24, 36, 0.88);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    animation: pt-fade-in 150ms ease forwards;
                }
                .pt-logo-wrap {
                    position: relative;
                    display: inline-block;
                    animation: pt-pulse 2.2s ease-in-out infinite;
                    filter: drop-shadow(0 6px 40px rgba(212,175,55,0.30));
                }
                .pt-logo {
                    width: 220px;
                    height: auto;
                    display: block;
                }
                .pt-glisten-wrap {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }
                .pt-glisten-beam {
                    position: absolute;
                    top: -30%;
                    width: 50%;
                    height: 160%;
                    background: linear-gradient(
                        105deg,
                        transparent 25%,
                        rgba(255,255,255,0.0) 38%,
                        rgba(255,255,255,0.80) 50%,
                        rgba(255,255,255,0.0) 62%,
                        transparent 75%
                    );
                    animation: pt-glisten 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    animation-delay: 0.4s;
                }
                .pt-bar-track {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 3px;
                    background: rgba(212,175,55,0.15);
                    z-index: 100000;
                }
                .pt-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #b8860b, #d4af37, #f0d060, #d4af37);
                    animation: pt-bar 2.8s cubic-bezier(0.1, 0.4, 0.3, 1) forwards;
                    border-radius: 0 2px 2px 0;
                }
            `}</style>

            <div className="pt-overlay">
                <div className="pt-logo-wrap">
                    <img
                        src="/logoPythias-400.png"
                        alt="Loading…"
                        className="pt-logo"
                    />
                    <div className="pt-glisten-wrap">
                        <div className="pt-glisten-beam" />
                    </div>
                </div>
            </div>

            <div className="pt-bar-track">
                <div className="pt-bar-fill" />
            </div>
        </>
    );
}
