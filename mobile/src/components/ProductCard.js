import React, { useState, useCallback, memo } from "react";
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { useAccent } from "../theme";
import { useCart } from "../cart";
import { useFavorites } from "../favorites";
import { trackEvent } from "../analytics";

// Shared catalog card used by BOTH HomeScreen and SearchScreen, mirroring the web ProductCard:
//   • multiple styles  — a "+N styles" badge that opens an all-blanks modal (from dedupeByDesign's
//     styleProducts). Color swatches are intentionally omitted on mobile (too small to read).
//   • sale pricing     — sale price in accent + struck-through compare-at + a "Sale" badge.
//   • favorites        — a heart toggle (optimistic, via FavoritesProvider).
//   • quick add        — a "+" that adds the default variant to the cart without leaving the grid,
//                        with a brief toast confirmation.
// The product is the shaped productCardData object returned by /api/app/products.

const imageOf = (p) => p.image || (Array.isArray(p.images) && p.images[0]) || (p.colorImages || []).find((c) => c.image)?.image || null;
const baseCentsOf = (p) => p.priceCents ?? p.priceFromCents ?? p.minPriceCents ?? (typeof p.price === "number" ? Math.round(p.price * 100) : 0);
const money = (c) => `$${(c / 100).toFixed(2)}`;
const idOf = (p) => p.id || p._id || p.slug || p.sku;

function ProductCard({ product, onPress, onToast }) {
    const accent = useAccent();
    const { add } = useCart();
    const fav = useFavorites();
    const [stylesOpen, setStylesOpen] = useState(false);

    const productId = product.id || product._id;
    const isFav = fav?.isFavorite(productId);

    const baseCents = baseCentsOf(product);
    const onSale = !!product.onSale && product.compareAtCents > baseCents;
    const compareCents = onSale ? product.compareAtCents : 0;
    const savePct = onSale && compareCents > 0 ? Math.round((1 - baseCents / compareCents) * 100) : 0;

    const styleCount = product.styleCount || 1;
    const styleProducts = product.styleProducts || [];

    const toggleFav = useCallback((e) => {
        e?.stopPropagation?.();
        fav?.toggle({
            productId,
            sku: product.defaultSku || product.sku || "",
            title: product.title,
            image: imageOf(product),
            priceCents: product.defaultPriceCents ?? baseCents,
        });
    }, [fav, productId, product, baseCents]);

    const quickAdd = useCallback((e) => {
        e?.stopPropagation?.();
        const sku = product.defaultSku || product.sku;
        if (!sku) { onPress?.(); return; }   // no resolvable variant → fall back to the detail screen
        const variantLabel = [product.defaultColor, product.defaultSize].filter(Boolean).join(" / ");
        add({
            sku,
            productId,
            title: product.title,
            variantLabel,
            image: imageOf(product),
            priceCents: product.defaultPriceCents ?? baseCents,
        });
        trackEvent("add_to_cart", { productId, source: "quick_add" });
        onToast?.(`Added "${product.title}"`);
    }, [add, product, productId, baseCents, onToast, onPress]);

    return (
        <View style={styles.card}>
            <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
                <View>
                    {imageOf(product)
                        ? <Image source={{ uri: imageOf(product) }} style={styles.img} resizeMode="cover" />
                        : <View style={[styles.img, styles.imgPlaceholder]} />}

                    {/* Top-left badges: Sale (priority) or New, then a styles badge. */}
                    <View style={styles.badges}>
                        {onSale
                            ? <View style={[styles.badge, styles.saleBadge]}><Text style={styles.badgeText}>{savePct > 0 ? `SALE ${savePct}%` : "SALE"}</Text></View>
                            : product.isNew ? <View style={[styles.badge, styles.newBadge]}><Text style={styles.badgeText}>NEW</Text></View> : null}
                        {styleCount > 1 && (
                            <TouchableOpacity onPress={() => setStylesOpen(true)} style={[styles.badge, styles.stylesBadge]}>
                                <Text style={styles.badgeText}>+{styleCount - 1} styles</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Favorite heart (top-right). */}
                    <TouchableOpacity onPress={toggleFav} style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={[styles.heart, isFav && { color: "#e0245e" }]}>{isFav ? "♥" : "♡"}</Text>
                    </TouchableOpacity>

                    {/* Quick add (bottom-right of the image). */}
                    <TouchableOpacity onPress={quickAdd} style={[styles.quickAdd, { backgroundColor: accent }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.quickAddText}>+</Text>
                    </TouchableOpacity>
                </View>

                <Text numberOfLines={2} style={styles.title}>{product.title}</Text>

                {baseCents > 0 && (
                    <View style={styles.priceRow}>
                        {product.priceVaries && <Text style={styles.from}>From</Text>}
                        <Text style={[styles.price, { color: onSale ? accent : "#111" }]}>{money(baseCents)}</Text>
                        {onSale && <Text style={styles.compareAt}>{money(compareCents)}</Text>}
                    </View>
                )}
            </TouchableOpacity>

            {/* "All styles" modal — every blank that shares this design. */}
            <Modal visible={stylesOpen} transparent animationType="fade" onRequestClose={() => setStylesOpen(false)}>
                <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setStylesOpen(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text numberOfLines={1} style={styles.modalTitle}>{product.title} — {styleCount} styles</Text>
                            <TouchableOpacity onPress={() => setStylesOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={styles.modalClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalGrid}>
                            {styleProducts.map((s) => (
                                <TouchableOpacity key={s.id} style={styles.styleCell}
                                    onPress={() => { setStylesOpen(false); onPress?.(s.id || s.slug || s.sku); }}>
                                    {s.image
                                        ? <Image source={{ uri: s.image }} style={styles.styleImg} resizeMode="cover" />
                                        : <View style={[styles.styleImg, styles.imgPlaceholder]} />}
                                    <Text numberOfLines={1} style={styles.styleLabel}>{s.label}</Text>
                                    {typeof s.priceCents === "number" && s.priceCents > 0 && (
                                        <Text style={[styles.stylePrice, { color: accent }]}>{money(s.priceCents)}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee", paddingBottom: 10 },
    img: { width: "100%", aspectRatio: 1 },
    imgPlaceholder: { backgroundColor: "#f1f1f1" },
    badges: { position: "absolute", left: 6, top: 6, gap: 4, alignItems: "flex-start" },
    badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    saleBadge: { backgroundColor: "#dc2626" },
    newBadge: { backgroundColor: "#0f172a" },
    stylesBadge: { backgroundColor: "rgba(17,24,39,0.82)" },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
    heartBtn: { position: "absolute", right: 6, top: 6, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
    heart: { fontSize: 18, lineHeight: 20, color: "#374151" },
    quickAdd: { position: "absolute", right: 6, bottom: 6, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
    quickAddText: { color: "#fff", fontSize: 22, lineHeight: 24, fontWeight: "700" },
    title: { fontSize: 13, fontWeight: "500", color: "#111", paddingHorizontal: 8, paddingTop: 8 },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, paddingHorizontal: 8, paddingTop: 2 },
    from: { fontSize: 11, color: "#94a3b8" },
    price: { fontSize: 14, fontWeight: "700" },
    compareAt: { fontSize: 12, color: "#94a3b8", textDecorationLine: "line-through" },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
    modalSheet: { backgroundColor: "#fff", borderRadius: 14, maxHeight: "82%", padding: 16 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    modalTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111", marginRight: 10 },
    modalClose: { fontSize: 26, lineHeight: 28, color: "#6b7280" },
    modalGrid: { flexDirection: "row", flexWrap: "wrap" },
    styleCell: { width: "33.333%", padding: 6 },
    styleImg: { width: "100%", aspectRatio: 1, borderRadius: 8, backgroundColor: "#f1f1f1" },
    styleLabel: { fontSize: 12, fontWeight: "600", color: "#111", marginTop: 4 },
    stylePrice: { fontSize: 12, fontWeight: "700" },
});

export { idOf };
export default memo(ProductCard);
