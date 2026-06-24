import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { getProducts } from "../api";
import { useAccent } from "../theme";

// Catalog grid driven by /api/app/products. Tapping a card opens the product detail screen.
export default function HomeScreen({ navigation }) {
    const accent = useAccent();
    const [products, setProducts] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { const d = await getProducts(); setProducts(d.products || []); }
        catch { setProducts([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

    if (!products) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <FlatList
            data={products}
            keyExtractor={(p, i) => String(p.id || p._id || p.sku || i)}
            numColumns={2}
            contentContainerStyle={{ padding: 6 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
                <TouchableOpacity onPress={() => navigation.navigate("DesignStudio")}
                    style={[styles.designBanner, { borderColor: accent }]}>
                    <Text style={[styles.designText, { color: accent }]}>🎨  Design your own</Text>
                </TouchableOpacity>
            }
            ListEmptyComponent={<View style={styles.center}><Text style={styles.muted}>No products yet.</Text></View>}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} activeOpacity={0.85}
                    onPress={() => navigation.navigate("Product", { id: item.id || item._id || item.slug || item.sku })}>
                    {imageOf(item)
                        ? <Image source={{ uri: imageOf(item) }} style={styles.img} resizeMode="cover" />
                        : <View style={[styles.img, styles.imgPlaceholder]} />}
                    <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                    <Text style={[styles.price, { color: accent }]}>{priceOf(item)}</Text>
                </TouchableOpacity>
            )}
        />
    );
}

function imageOf(p) { return p.image || (Array.isArray(p.images) && p.images[0]) || null; }
function priceOf(p) {
    const cents = p.priceFromCents ?? p.priceCents ?? p.minPriceCents ?? (typeof p.price === "number" ? p.price * 100 : 0);
    return cents ? `$${(cents / 100).toFixed(2)}` : "";
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    muted: { color: "#6b7280" },
    card: { flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
    img: { width: "100%", aspectRatio: 1 },
    imgPlaceholder: { backgroundColor: "#f1f1f1" },
    title: { fontSize: 13, fontWeight: "500", color: "#111", paddingHorizontal: 8, paddingTop: 8 },
    price: { fontSize: 14, fontWeight: "700", paddingHorizontal: 8, paddingTop: 2, paddingBottom: 10 },
    designBanner: { margin: 6, padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center" },
    designText: { fontSize: 15, fontWeight: "700" },
});
