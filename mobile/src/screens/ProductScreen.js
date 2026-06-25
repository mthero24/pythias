import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { getProduct } from "../api";
import { useAccent } from "../theme";
import { useCart } from "../cart";
import { trackEvent } from "../analytics";
import SizeChart from "../components/SizeChart";

// Product detail with SEPARATE color + size selectors (mirrors the web product page),
// plus feature bullets, a collapsible size chart, and a "You may also like" rail.
export default function ProductScreen({ route, navigation }) {
    const { id } = route.params || {};
    const accent = useAccent();
    const { add } = useCart();
    const [p, setP] = useState(null);
    const [color, setColor] = useState(null);
    const [size, setSize] = useState(null);
    const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

    useEffect(() => {
        getProduct(id).then((d) => {
            const prod = d.product || false;
            setP(prod);
            if (prod) {
                const vs = prod.variants || [];
                const def = vs.find((v) => v.priceCents > 0) || vs[0] || null;
                setColor(def?.color ?? null);
                setSize(def?.size ?? null);
                if (prod.title) navigation.setOptions({ title: prod.title });
            }
        }).catch(() => setP(false));
    }, [id]);

    if (p === null) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!p) return <View style={styles.center}><Text style={styles.muted}>Product not found.</Text></View>;

    const variants = p.variants || [];

    // Distinct colors (with optional hex swatch + a representative image) and sizes.
    const colors = [];
    const sizes = [];
    const seenC = new Set(), seenS = new Set();
    for (const v of variants) {
        if (v.color && !seenC.has(v.color)) { seenC.add(v.color); colors.push({ name: v.color, hex: v.hex || v.colorHex || null, image: v.image }); }
        if (v.size && !seenS.has(v.size)) { seenS.add(v.size); sizes.push(v.size); }
    }

    // Resolve the selected variant from (color, size), with graceful fallbacks.
    const matchExact = (c, s) => variants.find((v) => (!colors.length || v.color === c) && (!sizes.length || v.size === s));
    const sel = matchExact(color, size)
        || (color && variants.find((v) => v.color === color))
        || (size && variants.find((v) => v.size === size))
        || variants[0] || null;

    const sizeAvailable = (sz) => !colors.length || variants.some((v) => v.color === color && v.size === sz);

    const priceCents = sel?.priceCents || p.priceFromCents || 0;
    const heroImg = sel?.image || colors.find((c) => c.name === color)?.image || p.images?.[0];
    const variantLabel = (v) => [v?.color, v?.size].filter(Boolean).join(" / ") || v?.name || v?.sku;

    // When the color changes, keep the size if it's available for that color; otherwise jump to its first available size.
    const pickColor = (name) => {
        setColor(name);
        if (sizes.length && !variants.some((v) => v.color === name && v.size === size)) {
            setSize(variants.find((v) => v.color === name)?.size ?? null);
        }
    };

    const addToCart = () => {
        if (!sel) return;
        add({ sku: sel.sku, productId: p.id, title: p.title, variantLabel: variantLabel(sel), image: heroImg, priceCents });
        trackEvent("add_to_cart", { productId: p.id });
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

                    {colors.length > 0 && (
                        <View style={styles.group}>
                            <Text style={styles.groupLabel}>Color{color ? `: ${color}` : ""}</Text>
                            <View style={styles.chips}>
                                {colors.map((c) => {
                                    const active = color === c.name;
                                    return (
                                        <TouchableOpacity key={c.name} onPress={() => pickColor(c.name)}
                                            style={[c.hex ? styles.swatch : styles.chip, active && (c.hex ? { borderColor: accent, borderWidth: 3 } : { borderColor: accent, backgroundColor: accent + "18" })]}>
                                            {c.hex
                                                ? <View style={[styles.swatchDot, { backgroundColor: c.hex }]} />
                                                : <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>{c.name}</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {sizes.length > 0 && (
                        <View style={styles.group}>
                            <View style={styles.sizeHeader}>
                                <Text style={styles.groupLabel}>Size</Text>
                                {p.sizeGuide?.enabled && (
                                    <TouchableOpacity onPress={() => setSizeGuideOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={[styles.sizeGuideLink, { color: accent }]}>📏 Size guide</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.chips}>
                                {sizes.map((sz) => {
                                    const active = size === sz;
                                    const avail = sizeAvailable(sz);
                                    return (
                                        <TouchableOpacity key={sz} disabled={!avail} onPress={() => setSize(sz)}
                                            style={[styles.chip, active && { borderColor: accent, backgroundColor: accent + "18" }, !avail && styles.chipDisabled]}>
                                            <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }, !avail && styles.chipTextDisabled]}>{sz}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {!!p.description && <Text style={styles.desc}>{stripHtml(p.description)}</Text>}

                    {Array.isArray(p.bulletPoints) && p.bulletPoints.length > 0 && (
                        <View style={styles.bullets}>
                            {p.bulletPoints.map((bp, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                                    <Text style={styles.bulletText}>
                                        {!!bp.title && <Text style={styles.bulletTitle}>{bp.title}{bp.description ? ": " : ""}</Text>}
                                        {bp.description}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <SizeChart guide={p.sizeGuide} open={sizeGuideOpen} onToggle={() => setSizeGuideOpen((o) => !o)} />

                    {Array.isArray(p.related) && p.related.length > 0 && (
                        <View style={styles.related}>
                            <Text style={styles.relatedTitle}>You may also like</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                                {p.related.map((r) => {
                                    const rid = r.id || r._id || r.slug || r.sku;
                                    const rimg = r.image || (Array.isArray(r.images) && r.images[0]) || (r.colorImages || []).find((c) => c.image)?.image || null;
                                    const rcents = r.priceCents ?? r.priceFromCents ?? r.minPriceCents ?? 0;
                                    return (
                                        <TouchableOpacity key={rid} style={styles.relCard} activeOpacity={0.85}
                                            onPress={() => (navigation.push || navigation.navigate)("Product", { id: rid })}>
                                            {rimg ? <Image source={{ uri: rimg }} style={styles.relImg} resizeMode="cover" /> : <View style={[styles.relImg, { backgroundColor: "#f1f1f1" }]} />}
                                            <Text numberOfLines={2} style={styles.relName}>{r.title}</Text>
                                            {rcents > 0 && <Text style={[styles.relPrice, { color: accent }]}>${(rcents / 100).toFixed(2)}</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bar}>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: accent }, !sel && { opacity: 0.5 }]} onPress={addToCart} disabled={!sel}>
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
    group: { marginTop: 18 },
    groupLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
    sizeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sizeGuideLink: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipText: { fontSize: 13, color: "#111" },
    chipDisabled: { borderColor: "#eee", backgroundColor: "#fafafa" },
    chipTextDisabled: { color: "#c4c4c4", textDecorationLine: "line-through" },
    swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
    swatchDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
    desc: { fontSize: 14, lineHeight: 22, color: "#374151", marginTop: 18 },
    bullets: { marginTop: 18, gap: 12 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start" },
    bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, marginRight: 11 },
    bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: "#374151" },
    bulletTitle: { fontWeight: "700", color: "#111" },
    related: { marginTop: 28 },
    relatedTitle: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 14 },
    relCard: { width: 140, marginRight: 12 },
    relImg: { width: 140, height: 140, borderRadius: 10, backgroundColor: "#f1f1f1" },
    relName: { fontSize: 13, color: "#111", marginTop: 7 },
    relPrice: { fontSize: 14, fontWeight: "700", marginTop: 3 },
    bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
    addBtn: { borderRadius: 10, paddingVertical: 15, alignItems: "center" },
    addText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
