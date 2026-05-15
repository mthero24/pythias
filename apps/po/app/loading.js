export default function Loading() {
    return (
        <>
            <style>{`
                @keyframes po-ld-fade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes po-ld-pulse {
                    0%, 100% { opacity: 0.88; transform: scale(1);    }
                    50%       { opacity: 1;    transform: scale(1.04); }
                }
                @keyframes po-ld-glisten {
                    0%   { left: -80%; }
                    100% { left: 140%; }
                }
                @keyframes po-ld-bar {
                    0%   { width: 0%;  }
                    60%  { width: 72%; }
                    100% { width: 88%; }
                }
                .po-ld-overlay {
                    position: fixed; inset: 0; z-index: 99999;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(20,24,36,0.88);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    animation: po-ld-fade 150ms ease forwards;
                }
                .po-ld-logo-wrap {
                    position: relative; display: inline-block;
                    animation: po-ld-pulse 2.2s ease-in-out infinite;
                    filter: drop-shadow(0 6px 40px rgba(212,175,55,0.30));
                }
                .po-ld-logo { width: 220px; height: auto; display: block; }
                .po-ld-glisten-wrap {
                    position: absolute; inset: 0; overflow: hidden; pointer-events: none;
                }
                .po-ld-glisten-beam {
                    position: absolute; top: -30%; width: 50%; height: 160%;
                    background: linear-gradient(105deg,
                        transparent 25%, rgba(255,255,255,0) 38%,
                        rgba(255,255,255,0.55) 50%,
                        rgba(255,255,255,0) 62%, transparent 75%);
                    animation: po-ld-glisten 2s cubic-bezier(0.4,0,0.6,1) infinite;
                    animation-delay: 0.4s;
                }
                .po-ld-bar-track {
                    position: fixed; bottom: 0; left: 0; right: 0;
                    height: 3px; background: rgba(212,175,55,0.15); z-index: 100000;
                }
                .po-ld-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg,#b8860b,#d4af37,#f0d060,#d4af37);
                    animation: po-ld-bar 2.8s cubic-bezier(0.1,0.4,0.3,1) forwards;
                    border-radius: 0 2px 2px 0;
                }
            `}</style>
            <div className="po-ld-overlay">
                <div className="po-ld-logo-wrap">
                    <img src="/logoPythias-400.png" alt="Loading…" className="po-ld-logo" />
                    <div className="po-ld-glisten-wrap">
                        <div className="po-ld-glisten-beam" />
                    </div>
                </div>
            </div>
            <div className="po-ld-bar-track">
                <div className="po-ld-bar-fill" />
            </div>
        </>
    );
}
