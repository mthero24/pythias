"use client";
import React from "react";

const LoaderOverlay = () => (
    <>
        <style>{`
            @keyframes lo-fade-in {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            @keyframes lo-glisten {
                0%   { left: -80%; }
                100% { left: 140%; }
            }
            @keyframes lo-pulse {
                0%, 100% { opacity: 0.88; transform: scale(1);    }
                50%       { opacity: 1;    transform: scale(1.04); }
            }
            .lo-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(20, 24, 36, 0.88);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                animation: lo-fade-in 150ms ease forwards;
            }
            .lo-logo-wrap {
                position: relative;
                display: inline-block;
                animation: lo-pulse 2.2s ease-in-out infinite;
                filter: drop-shadow(0 6px 40px rgba(212,175,55,0.30));
            }
            .lo-logo {
                width: 220px;
                height: auto;
                display: block;
            }
            .lo-glisten-wrap {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
            }
            .lo-glisten-beam {
                position: absolute;
                top: -30%;
                width: 50%;
                height: 160%;
                background: linear-gradient(
                    105deg,
                    transparent 25%,
                    rgba(255,255,255,0.0) 38%,
                    rgba(255,255,255,0.55) 50%,
                    rgba(255,255,255,0.0) 62%,
                    transparent 75%
                );
                animation: lo-glisten 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                animation-delay: 0.4s;
            }
        `}</style>
        <div className="lo-overlay">
            <div className="lo-logo-wrap">
                <img src="/logoPythias-400.png" alt="Loading…" className="lo-logo" />
                <div className="lo-glisten-wrap">
                    <div className="lo-glisten-beam" />
                </div>
            </div>
        </div>
    </>
);

export default LoaderOverlay;
