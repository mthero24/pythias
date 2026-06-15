// Shown when an incoming host doesn't resolve to a storefront.
export default function NoSite() {
    return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", color: "#111" }}>
            <div style={{ textAlign: "center", padding: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>No storefront here yet</h1>
                <p style={{ opacity: 0.6 }}>This address isn&apos;t connected to a Pythias storefront.</p>
            </div>
        </main>
    );
}
