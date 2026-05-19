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
        return () => {
            window.removeEventListener("pythias:loader:start", on);
            window.removeEventListener("pythias:loader:stop",  off);
        };
    }, []);

    if (!active) return null;

    return (
        <>
            <style>{`
                @keyframes pp-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes pp-glisten {
                    0%   { left: -80%; }
                    100% { left: 140%; }
                }
                @keyframes pp-pulse {
                    0%, 100% { opacity: 0.9;  transform: scale(1);    }
                    50%       { opacity: 1;    transform: scale(1.04); }
                }
                @keyframes pp-bar {
                    0%   { width: 0%;  }
                    60%  { width: 72%; }
                    100% { width: 88%; }
                }
                .pp-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(20, 24, 36, 0.88);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    animation: pp-fade-in 150ms ease forwards;
                }
                .pp-logo-wrap {
                    position: relative;
                    display: inline-block;
                    animation: pp-pulse 2.2s ease-in-out infinite;
                    filter: drop-shadow(0 6px 40px rgba(212,175,55,0.30));
                }
                .pp-logo {
                    width: 220px;
                    height: auto;
                    display: block;
                }
                .pp-glisten-wrap {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }
                .pp-glisten-beam {
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
                    animation: pp-glisten 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    animation-delay: 0.4s;
                }
                .pp-bar-track {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 3px;
                    background: rgba(212,175,55,0.15);
                    z-index: 100000;
                }
                .pp-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #b8860b, #d4af37, #f0d060, #d4af37);
                    animation: pp-bar 2.8s cubic-bezier(0.1, 0.4, 0.3, 1) forwards;
                    border-radius: 0 2px 2px 0;
                }
            `}</style>

            <div className="pp-overlay">
                <div className="pp-logo-wrap">
                    <img
                        src="/logoPythias-400.png"
                        alt="Loading…"
                        className="pp-logo"
                    />
                    <div className="pp-glisten-wrap">
                        <div className="pp-glisten-beam" />
                    </div>
                </div>
            </div>

            <div className="pp-bar-track">
                <div className="pp-bar-fill" />
            </div>
        </>
    );
}
