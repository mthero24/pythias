import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet } from "react-native";
import { getProducts } from "../api";
import ProductCard, { idOf } from "../components/ProductCard";
import { useToast } from "./HomeScreen";

// Search over the catalog via /api/app/products?q= (debounced). Uses the shared ProductCard so search
// results get the same multiple-styles / sale / favorites / quick-add behavior as the home grid.
export default function SearchScreen({ navigation }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);
    const toast = useToast();

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

    const openProduct = useCallback((id) => navigation.navigate("Product", { id }), [navigation]);

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
                keyExtractor={(p, i) => String(idOf(p) || i)}
                numColumns={2}
                contentContainerStyle={{ padding: 6 }}
                ListEmptyComponent={!loading && q ? <Text style={styles.empty}>No results.</Text> : null}
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

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#fff" },
    searchBar: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
    input: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    empty: { textAlign: "center", color: "#9ca3af", marginTop: 30 },
});
