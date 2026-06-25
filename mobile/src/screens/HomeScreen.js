import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, StyleSheet } from "react-native";
import { getProducts } from "../api";
import { useAccent } from "../theme";
import ProductCard, { idOf } from "../components/ProductCard";

// Catalog grid driven by /api/app/products. Cards are the shared ProductCard (multiple styles, sale
// pricing, favorites, quick add). Tapping a card opens the product detail screen.
export default function HomeScreen({ navigation }) {
    const accent = useAccent();
    const [products, setProducts] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const toast = useToast();

    const load = useCallback(async () => {
        try { const d = await getProducts(); setProducts(d.products || []); }
        catch { setProducts([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
    const openProduct = useCallback((id) => navigation.navigate("Product", { id }), [navigation]);

    if (!products) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={products}
                keyExtractor={(p, i) => String(idOf(p) || i)}
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
                    <ProductCard
                        product={item}
                        onPress={(altId) => openProduct(altId || idOf(item))}
                        onToast={toast.show}
                    />
                )}
            />
            <toast.View />
        </View>
    );
}

// Minimal bottom toast for quick-add confirmation (auto-dismisses).
export function useToast() {
    const [msg, setMsg] = useState(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef(null);
    const accent = useAccent();

    const show = useCallback((text) => {
        setMsg(text);
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setMsg(null));
        }, 1600);
    }, [opacity]);

    const ToastView = useCallback(() => (
        msg ? (
            <Animated.View pointerEvents="none" style={[toastStyles.wrap, { opacity, borderColor: accent }]}>
                <Text style={toastStyles.text}>✓ {msg}</Text>
            </Animated.View>
        ) : null
    ), [msg, opacity, accent]);

    return { show, View: ToastView };
}

const toastStyles = StyleSheet.create({
    wrap: { position: "absolute", left: 20, right: 20, bottom: 24, backgroundColor: "#111", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 2 },
    text: { color: "#fff", fontWeight: "600", textAlign: "center" },
});

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    muted: { color: "#6b7280" },
    designBanner: { margin: 6, padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center" },
    designText: { fontSize: 15, fontWeight: "700" },
});
