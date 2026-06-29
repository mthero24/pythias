export default function PayCancelled() {
    const wrap = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Arial, sans-serif", padding: 24 };
    const card = { maxWidth: 460, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", textAlign: "center" };
    return (
        <div style={wrap}>
            <div style={card}>
                <div style={{ background: "#111827", padding: "20px 32px" }}><span style={{ color: "#D3A73D", fontSize: 18, fontWeight: 700 }}>Pythias</span></div>
                <div style={{ padding: "36px 32px" }}>
                    <h1 style={{ color: "#111827", fontSize: 20, margin: "0 0 8px" }}>Payment cancelled</h1>
                    <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>No charge was made. You can reopen the payment link from your invoice email whenever you&apos;re ready.</p>
                </div>
            </div>
        </div>
    );
}
