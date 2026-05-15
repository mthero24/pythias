export default function Loading() {
    return (
        <div style={{
            position: "fixed", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backgroundColor: "#f8fafc",
            zIndex: 9999,
        }}>
            <style>{`
                @keyframes pythias-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.55; transform: scale(0.96); }
                }
                @keyframes pythias-spin {
                    to { transform: rotate(360deg); }
                }
                .pythias-loading-logo {
                    animation: pythias-pulse 1.8s ease-in-out infinite;
                }
                .pythias-loading-spinner {
                    width: 28px;
                    height: 28px;
                    margin-top: 28px;
                    border-radius: 50%;
                    border: 2.5px solid #e2e8f0;
                    border-top-color: #6366f1;
                    animation: pythias-spin 0.75s linear infinite;
                }
            `}</style>
            <div className="pythias-loading-logo">
                <img
                    src="/logoPythias-400.png"
                    width="220"
                    height="66"
                    alt="Pythias Technologies"
                    style={{ objectFit: "contain", display: "block" }}
                />
            </div>
            <div className="pythias-loading-spinner" />
        </div>
    );
}
