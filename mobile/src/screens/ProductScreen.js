import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { getProduct } from "../api";
import { useAccent } from "../theme";

// Product detail from /api/app/products/:id. Add-to-cart wires to the existing cart/checkout APIs next.
export default function ProductScreen({ route, navigation }) {
    const { id } = route.params || {};
    const accent = useAccent();
    const [p, setP] = useState(null);

    useEffect(() => {
        getProduct(id).then((d) => { setP(d.product || false); if (d.product?.title) navigation.setOptions({ title: d.product.title }); })
            .catch(() => setP(false));
    }, [id]);

    if (p === null) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!p) return <View style={styles.center}><Text style={styles.muted}>Product not found.</Text></View>;

    return (
        <ScrollView style={{ backgroundColor: "#fff" }}>
            {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.hero} resizeMode="cover" /> : null}
            <View style={{ padding: 16 }}>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={[styles.price, { color: accent }]}>{p.priceFromCents ? `$${(p.priceFromCents / 100).toFixed(2)}` : ""}</Text>
                {!!p.brand && <Text style={styles.brand}>{p.brand}</Text>}
                <Text style={styles.desc}>{stripHtml(p.description)}</Text>
            </View>
        </ScrollView>
    );
}

function stripHtml(s) { return String(s || "").replace(/<[^>]*>/g, "").trim(); }

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
    hero: { width: "100%", height: 360, backgroundColor: "#f1f1f1" },
    title: { fontSize: 20, fontWeight: "700", color: "#111" },
    price: { fontSize: 18, fontWeight: "700", marginTop: 6 },
    brand: { fontSize: 13, color: "#6b7280", marginTop: 4 },
    desc: { fontSize: 14, lineHeight: 22, color: "#374151", marginTop: 14 },
});
