import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

// Collapsible "Size Chart" for the product page — fed by the blank's structured size guide
// (image + measurement table + how-to notes). Controlled by the parent (open / onToggle).
export default function SizeChart({ guide, open, onToggle }) {
    if (!guide?.enabled) return null;
    const columns = (guide.columns || []).filter(Boolean);
    const rows = (guide.rows || []).filter((r) => r?.size);
    const notes = (guide.measureNotes || []).filter((n) => n?.title || n?.body);
    const image = guide.image || (guide.images || [])[0] || null;
    if (!rows.length && !image && !notes.length) return null;

    return (
        <View style={styles.wrap}>
            <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
                <Text style={styles.title}>Size Chart</Text>
                <Text style={styles.toggle}>{open ? "–" : "+"}</Text>
            </TouchableOpacity>

            {open && (
                <View style={{ marginTop: 14 }}>
                    {!!guide.unit && <Text style={styles.unit}>All measurements in {guide.unit}</Text>}
                    {!!image && <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />}

                    {rows.length > 0 && columns.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                            <View style={styles.table}>
                                <View style={[styles.tr, styles.trHead]}>
                                    <Text style={[styles.th, styles.cellFirst]}>Size</Text>
                                    {columns.map((c) => <Text key={c} style={styles.th}>{c}</Text>)}
                                </View>
                                {rows.map((r, ri) => (
                                    <View key={ri} style={[styles.tr, ri % 2 ? styles.trAlt : null]}>
                                        <Text style={[styles.tdSize, styles.cellFirst]}>{r.size}</Text>
                                        {columns.map((c, ci) => <Text key={ci} style={styles.td}>{r.values?.[ci] || ""}</Text>)}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {notes.length > 0 && (
                        <View style={styles.notes}>
                            {notes.map((n, i) => (
                                <View key={i} style={{ marginBottom: i < notes.length - 1 ? 12 : 0 }}>
                                    {!!n.title && <Text style={styles.noteTitle}>{n.title}</Text>}
                                    {!!n.body && <Text style={styles.noteBody}>{n.body}</Text>}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const COL_W = 92;
const styles = StyleSheet.create({
    wrap: { marginTop: 22, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 18 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 16, fontWeight: "700", color: "#111" },
    toggle: { fontSize: 22, lineHeight: 24, color: "#6b7280" },
    unit: { textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 14 },
    image: { width: "100%", height: 220, marginBottom: 16, backgroundColor: "#fff" },
    tableScroll: { borderWidth: 1, borderColor: "#eef1f5", borderRadius: 10 },
    table: { minWidth: "100%" },
    tr: { flexDirection: "row" },
    trHead: { backgroundColor: "#f8fafc" },
    trAlt: { backgroundColor: "#fcfcfd" },
    th: { width: COL_W, paddingVertical: 11, paddingHorizontal: 12, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", color: "#64748b", borderBottomWidth: 1, borderBottomColor: "#eef1f5" },
    td: { width: COL_W, paddingVertical: 11, paddingHorizontal: 12, fontSize: 13, fontWeight: "600", color: "#111", borderBottomWidth: 1, borderBottomColor: "#eef1f5" },
    tdSize: { width: COL_W, paddingVertical: 11, paddingHorizontal: 12, fontSize: 13, fontWeight: "700", color: "#111", borderBottomWidth: 1, borderBottomColor: "#eef1f5" },
    cellFirst: { position: "relative" },
    notes: { marginTop: 18, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#eef1f5", borderRadius: 10, padding: 16 },
    noteTitle: { fontWeight: "700", fontSize: 13, color: "#111", marginBottom: 3 },
    noteBody: { lineHeight: 21, fontSize: 13, color: "#64748b" },
});
