import React, { useEffect, useState, useRef } from "react";
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { getConfirmation } from "../api";
import { useAccent } from "../theme";

// Shown after a successful PaymentSheet. The order is placed async by the Stripe webhook, so we poll
// /api/checkout/confirmation?pi= until it appears, then show the summary.
export default function ConfirmationScreen({ route, navigation }) {
    const { pi } = route.params || {};
    const accent = useAccent();
    const [order, setOrder] = useState(null);
    const [done, setDone] = useState(false);     // stopped polling (found or timed out)
    const tries = useRef(0);

    useEffect(() => {
        let alive = true;
        const poll = async () => {
            if (!alive) return;
            tries.current += 1;
            try {
                const d = await getConfirmation(pi);
                if (d.order) { setOrder(d.order); setDone(true); return; }
            } catch { /* keep trying */ }
            if (tries.current >= 15) { setDone(true); return; }   // ~30s
            setTimeout(poll, 2000);
        };
        if (pi) poll(); else setDone(true);
        return () => { alive = false; };
    }, [pi]);

    const goHome = () => navigation.reset({ index: 0, routes: [{ name: "Main" }] });

    return (
        <ScrollView style={{ backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, alignItems: "center" }}>
            <Text style={[styles.check, { color: accent }]}>✓</Text>
            <Text style={styles.h}>Thank you!</Text>
            <Text style={styles.sub}>Your order is confirmed. A receipt is on its way to your email.</Text>

            {!done && <View style={styles.loading}><ActivityIndicator /><Text style={styles.loadingText}>Finalizing your order…</Text></View>}

            {order && (
                <View style={styles.card}>
                    {order.poNumber ? <Text style={styles.po}>Order {order.poNumber}</Text> : null}
                    {(order.lines || []).map((l, i) => (
                        <View key={i} style={styles.line}>
                            <Text style={styles.lineName} numberOfLines={2}>{l.qty}× {l.name}</Text>
                            <Text style={styles.linePrice}>${((l.price || 0) * (l.qty || 1)).toFixed(2)}</Text>
                        </View>
                    ))}
                    {order.totals ? (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalVal}>${(order.totals.total || 0).toFixed(2)}</Text>
                        </View>
                    ) : null}
                </View>
            )}

            <TouchableOpacity style={[styles.btn, { backgroundColor: accent }]} onPress={goHome}>
                <Text style={styles.btnText}>Continue shopping</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    check: { fontSize: 56, fontWeight: "800" },
    h: { fontSize: 24, fontWeight: "800", color: "#111", marginTop: 8 },
    sub: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8, maxWidth: 300 },
    loading: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 },
    loadingText: { color: "#6b7280" },
    card: { alignSelf: "stretch", marginTop: 24, padding: 16, borderWidth: 1, borderColor: "#eee", borderRadius: 12 },
    po: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 10 },
    line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    lineName: { flex: 1, fontSize: 14, color: "#374151", marginRight: 10 },
    linePrice: { fontSize: 14, color: "#111" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee" },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
    totalVal: { fontSize: 16, fontWeight: "800", color: "#111" },
    btn: { alignSelf: "stretch", borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 28 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
