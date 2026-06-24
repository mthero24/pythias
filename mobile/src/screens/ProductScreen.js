import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { getProduct } from "../api";
import { useAccent } from "../theme";
import { useCart } from "../cart";

// Product detail from /api/app/products/:id with a variant selector + add-to-cart.
export default function ProductScreen({ route, navigation }) {
    const { id } = route.params || {};
    const accent = useAccent();
    const { add } = useCart();
    const [p, setP] = useState(null);
    const [sel, setSel] = useState(null);   // selected variant

    useEffect(() => {
        getProduct(id).then((d) => {
            const prod = d.product || false;
            setP(prod);
            if (prod) {
                const vs = prod.variants || [];
                setSel(vs.find((v) => v.priceCents > 0) || vs[0] || null);
                if (prod.title) navigation.setOptions({ title: prod.title });
            }
        }).catch(() => setP(false));
    }, [id]);

    if (p === null) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!p) return <View style={styles.center}><Text style={styles.muted}>Product not found.</Text></View>;

    const variants = p.variants || [];
    const priceCents = sel?.priceCents || p.priceFromCents || 0;
    const heroImg = sel?.image || p.images?.[0];

    const variantLabel = (v) => v.name || [v.color, v.size].filter(Boolean).join(" ") || v.sku;
    const addToCart = () => {
        if (!sel) return;
        add({ sku: sel.sku, productId: p.id, title: p.title, variantLabel: variantLabel(sel), image: heroImg, priceCents });
        navigation.navigate("Main", { screen: "Cart" });
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {heroImg ? <Image source={{ uri: heroImg }} style={styles.hero} resizeMode="cover" /> : null}
                <View style={{ padding: 16 }}>
                    <Text style={styles.title}>{p.title}</Text>
                    <Text style={[styles.price, { color: accent }]}>{priceCents ? `$${(priceCents / 100).toFixed(2)}` : ""}</Text>
                    {!!p.brand && <Text style={styles.brand}>{p.brand}</Text>}

                    {variants.length > 1 && (
                        <View style={styles.variants}>
                            <Text style={styles.variantsLabel}>Options</Text>
                            <View style={styles.chips}>
                                {variants.map((v) => {
                                    const active = sel?.sku === v.sku;
                                    return (
                                        <TouchableOpacity key={v.sku} onPress={() => setSel(v)}
                                            style={[styles.chip, active && { borderColor: accent, backgroundColor: accent + "18" }]}>
                                            <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>{variantLabel(v)}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {!!p.description && <Text style={styles.desc}>{stripHtml(p.description)}</Text>}
                </View>
            </ScrollView>

            <View style={styles.bar}>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: accent }]} onPress={addToCart} disabled={!sel}>
                    <Text style={styles.addText}>Add to cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function stripHtml(s) { return String(s || "").replace(/<[^>]*>/g, "").trim(); }

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
    hero: { width: "100%", height: 380, backgroundColor: "#f1f1f1" },
    title: { fontSize: 20, fontWeight: "700", color: "#111" },
    price: { fontSize: 18, fontWeight: "700", marginTop: 6 },
    brand: { fontSize: 13, color: "#6b7280", marginTop: 4 },
    variants: { marginTop: 18 },
    variantsLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipText: { fontSize: 13, color: "#111" },
    desc: { fontSize: 14, lineHeight: 22, color: "#374151", marginTop: 18 },
    bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
    addBtn: { borderRadius: 10, paddingVertical: 15, alignItems: "center" },
    addText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
