import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, FlatList, Image, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { getProducts } from "../api";
import { useAccent } from "../theme";

// Search over the catalog via /api/app/products?q= (debounced).
export default function SearchScreen({ navigation }) {
    const accent = useAccent();
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (!q.trim()) { setResults([]); return; }
        timer.current = setTimeout(async () => {
            setLoading(true);
            try { const d = await getProducts(`q=${encodeURIComponent(q.trim())}`); setResults(d.products || []); }
            catch { setResults([]); }
            finally { setLoading(false); }
        }, 350);
        return () => timer.current && clearTimeout(timer.current);
    }, [q]);

    return (
        <View style={styles.wrap}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Search products…"
                    placeholderTextColor="#9ca3af"
                    value={q}
                    onChangeText={setQ}
                    autoCorrect={false}
                    returnKeyType="search"
                />
            </View>
            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
            <FlatList
                data={results}
                keyExtractor={(p, i) => String(p.id || p._id || p.sku || i)}
                numColumns={2}
                contentContainerStyle={{ padding: 6 }}
                ListEmptyComponent={!loading && q ? <Text style={styles.empty}>No results.</Text> : null}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Product", { id: item.id || item._id || item.slug || item.sku })}>
                        {imageOf(item) ? <Image source={{ uri: imageOf(item) }} style={styles.img} /> : <View style={[styles.img, { backgroundColor: "#f1f1f1" }]} />}
                        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                        <Text style={[styles.price, { color: accent }]}>{priceOf(item)}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

function imageOf(p) { return p.image || (Array.isArray(p.images) && p.images[0]) || null; }
function priceOf(p) {
    const cents = p.priceFromCents ?? p.priceCents ?? (typeof p.price === "number" ? p.price * 100 : 0);
    return cents ? `$${(cents / 100).toFixed(2)}` : "";
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#fff" },
    searchBar: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
    input: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    empty: { textAlign: "center", color: "#9ca3af", marginTop: 30 },
    card: { flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
    img: { width: "100%", aspectRatio: 1 },
    title: { fontSize: 13, color: "#111", paddingHorizontal: 8, paddingTop: 8 },
    price: { fontSize: 14, fontWeight: "700", paddingHorizontal: 8, paddingTop: 2, paddingBottom: 10 },
});
