import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useCart } from "../cart";
import { useStore, useAccent } from "../theme";
import { API_BASE, APP_KEY } from "../config";

// Address + email → /api/checkout/intent → Stripe PaymentSheet (cards / Apple Pay / Google Pay / Link).
// On success the Stripe webhook places the order server-side (same path as web), so we just confirm.
export default function CheckoutScreen({ navigation }) {
    const { items, subtotalCents, clear } = useCart();
    const store = useStore();
    const accent = useAccent();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [form, setForm] = useState({ name: "", email: "", address1: "", city: "", state: "", zip: "", country: "US", phone: "" });
    const [busy, setBusy] = useState(false);

    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
    const lineItems = items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty }));

    const onSuccess = () => {
        clear();
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        Alert.alert("Order placed", "Thank you! You'll receive an email confirmation shortly.");
    };

    const pay = async () => {
        if (!form.email || !form.address1 || !form.city || !form.zip) {
            Alert.alert("Missing info", "Please add your email and shipping address.");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/checkout/intent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-pythias-app-key": APP_KEY },
                body: JSON.stringify({ items: lineItems, shippingAddress: form, email: form.email }),
            });
            const data = await res.json();
            if (data.error) { Alert.alert("Checkout error", String(data.error)); return; }
            if (data.free && data.orderId) { onSuccess(); return; }      // fully covered — already placed
            if (!data.clientSecret) { Alert.alert("Checkout error", "Couldn't start payment."); return; }

            const init = await initPaymentSheet({
                merchantDisplayName: store?.store?.name || "Store",
                paymentIntentClientSecret: data.clientSecret,
                defaultBillingDetails: { name: form.name, email: form.email },
                allowsDelayedPaymentMethods: false,
            });
            if (init.error) { Alert.alert("Payment error", init.error.message); return; }

            const { error } = await presentPaymentSheet();
            if (error) { if (error.code !== "Canceled") Alert.alert("Payment", error.message); return; }
            onSuccess();
        } catch (e) {
            Alert.alert("Error", e.message || "Checkout failed.");
        } finally {
            setBusy(false);
        }
    };

    if (!items.length) return <View style={styles.center}><Text style={styles.muted}>Your cart is empty.</Text></View>;

    return (
        <ScrollView style={{ backgroundColor: "#fff" }} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.h}>Shipping address</Text>
            <Field label="Full name" value={form.name} onChangeText={set("name")} />
            <Field label="Email" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Address" value={form.address1} onChangeText={set("address1")} />
            <Field label="City" value={form.city} onChangeText={set("city")} />
            <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="State" value={form.state} onChangeText={set("state")} /></View>
                <View style={{ flex: 1 }}><Field label="ZIP" value={form.zip} onChangeText={set("zip")} keyboardType="numbers-and-punctuation" /></View>
            </View>
            <Field label="Country" value={form.country} onChangeText={set("country")} autoCapitalize="characters" />

            <View style={styles.summary}>
                <View style={styles.sumRow}><Text style={styles.sumLabel}>Subtotal</Text><Text style={styles.sumVal}>${(subtotalCents / 100).toFixed(2)}</Text></View>
                <Text style={styles.note}>Shipping & tax calculated at payment.</Text>
            </View>

            <TouchableOpacity style={[styles.pay, { backgroundColor: accent }]} onPress={pay} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.payText}>Continue to payment</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

function Field({ label, ...props }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
    h: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
    label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#111" },
    summary: { marginTop: 8, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee" },
    sumRow: { flexDirection: "row", justifyContent: "space-between" },
    sumLabel: { fontSize: 15, color: "#111" },
    sumVal: { fontSize: 15, fontWeight: "700", color: "#111" },
    note: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
    pay: { borderRadius: 10, paddingVertical: 15, alignItems: "center" },
    payText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
