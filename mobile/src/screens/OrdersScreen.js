import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { getOrders } from "../api";
import { useAccent } from "../theme";

// Order history + tracking from /api/account/orders (bearer-authed).
export default function OrdersScreen() {
    const accent = useAccent();
    const [orders, setOrders] = useState(null);

    useEffect(() => { getOrders().then((d) => setOrders(d.orders || [])).catch(() => setOrders([])); }, []);

    if (orders === null) return <View style={styles.center}><ActivityIndicator /></View>;
    if (!orders.length) return <View style={styles.center}><Text style={styles.muted}>No orders yet.</Text></View>;

    return (
        <FlatList
            data={orders}
            keyExtractor={(o) => o.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.po}>{item.poNumber || `#${item.id.slice(-6)}`}</Text>
                        <Text style={styles.date}>{fmtDate(item.date)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.status, { color: accent }]}>{labelStatus(item.status)}</Text>
                        {trackingUrl(item.tracking) ? (
                            <TouchableOpacity onPress={() => Linking.openURL(trackingUrl(item.tracking))}>
                                <Text style={styles.track}>Track package</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            )}
        />
    );
}

function trackingUrl(t) { return !t ? null : typeof t === "string" ? t : (t.url || null); }
function fmtDate(d) { try { return new Date(d).toLocaleDateString(); } catch { return ""; } }
function labelStatus(s) { return String(s || "pending").replace(/_/g, " "); }

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
    row: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    po: { fontSize: 15, fontWeight: "600", color: "#111" },
    date: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    status: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
    track: { fontSize: 13, color: "#2563eb", marginTop: 6 },
});
