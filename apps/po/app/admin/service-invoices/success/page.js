import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PaymentSuccessPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", gap: 16 }}>
            <div style={{ fontSize: 48 }}>✓</div>
            <h2 style={{ margin: 0, fontWeight: 800 }}>Payment Submitted</h2>
            <p style={{ color: "#666", margin: 0, textAlign: "center", maxWidth: 360 }}>
                Your ACH bank draft has been initiated. It typically settles within 1–4 business days. The invoice will be marked paid once the transfer completes.
            </p>
            <Link href="/admin/service-invoices" style={{ marginTop: 8, padding: "10px 24px", background: "#6366f1", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
                Back to Invoices
            </Link>
        </div>
    );
}
