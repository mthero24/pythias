import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useCart } from "../cart";
import { useAccent } from "../theme";

export default function CartScreen({ navigation }) {
    const { items, setQty, remove, subtotalCents } = useCart();
    const accent = useAccent();

    if (!items.length) {
        return <View style={styles.center}><Text style={styles.muted}>Your cart is empty.</Text></View>;
    }

    return (
        <View style={styles.wrap}>
            <FlatList
                data={items}
                keyExtractor={(x) => x.sku}
                contentContainerStyle={{ padding: 12 }}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        {item.image ? <Image source={{ uri: item.image }} style={styles.img} /> : <View style={[styles.img, styles.imgPh]} />}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text numberOfLines={2} style={styles.name}>{item.title}{item.variantLabel ? ` — ${item.variantLabel}` : ""}</Text>
                            <Text style={[styles.price, { color: accent }]}>${((item.priceCents || 0) / 100).toFixed(2)}</Text>
                            <View style={styles.qtyRow}>
                                <Stepper label="−" onPress={() => setQty(item.sku, item.qty - 1)} />
                                <Text style={styles.qty}>{item.qty}</Text>
                                <Stepper label="+" onPress={() => setQty(item.sku, item.qty + 1)} />
                                <TouchableOpacity onPress={() => remove(item.sku)}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
            <View style={styles.footer}>
                <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalLabel}>Subtotal</Text>
                    <Text style={styles.subtotalVal}>${(subtotalCents / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.note}>Shipping & tax calculated at checkout.</Text>
                <TouchableOpacity style={[styles.checkout, { backgroundColor: accent }]} onPress={() => navigation.navigate("Checkout")}>
                    <Text style={styles.checkoutText}>Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function Stepper({ label, onPress }) {
    return <TouchableOpacity style={styles.stepper} onPress={onPress}><Text style={styles.stepperText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
    row: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    img: { width: 76, height: 76, borderRadius: 8 },
    imgPh: { backgroundColor: "#f1f1f1" },
    name: { fontSize: 14, fontWeight: "500", color: "#111" },
    price: { fontSize: 14, fontWeight: "700", marginTop: 3 },
    qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
    stepper: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
    stepperText: { fontSize: 18, color: "#111" },
    qty: { minWidth: 22, textAlign: "center", fontSize: 15 },
    remove: { color: "#9ca3af", marginLeft: 12, fontSize: 13 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#eee" },
    subtotalRow: { flexDirection: "row", justifyContent: "space-between" },
    subtotalLabel: { fontSize: 16, color: "#111" },
    subtotalVal: { fontSize: 16, fontWeight: "700", color: "#111" },
    note: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
    checkout: { marginTop: 14, borderRadius: 10, paddingVertical: 15, alignItems: "center" },
    checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
