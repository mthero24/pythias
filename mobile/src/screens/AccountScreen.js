import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useAuth } from "../auth";
import { useAccent } from "../theme";

export default function AccountScreen({ navigation }) {
    const { ready, isAuthed, customer, login, signup, logout } = useAuth();
    const accent = useAccent();
    const [mode, setMode] = useState("login");   // login | register
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);

    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

    if (!ready) return <View style={styles.center}><ActivityIndicator /></View>;

    if (isAuthed) {
        return (
            <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.hi}>Hi {customer?.name || customer?.email}</Text>
                <Text style={styles.email}>{customer?.email}</Text>
                <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate("Orders")}>
                    <Text style={styles.tileText}>My orders</Text><Text style={styles.chev}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.logout]} onPress={logout}>
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    const submit = async () => {
        if (!form.email || !form.password) { Alert.alert("Missing info", "Email and password are required."); return; }
        setBusy(true);
        try {
            if (mode === "login") await login(form.email.trim().toLowerCase(), form.password);
            else await signup({ name: form.name, email: form.email.trim().toLowerCase(), password: form.password });
        } catch (e) {
            Alert.alert(mode === "login" ? "Login failed" : "Sign-up failed", e.message || "Please try again.");
        } finally { setBusy(false); }
    };

    return (
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.h}>{mode === "login" ? "Log in" : "Create account"}</Text>
            {mode === "register" && <Field label="Name" value={form.name} onChangeText={set("name")} />}
            <Field label="Email" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Password" value={form.password} onChangeText={set("password")} secureTextEntry />
            <TouchableOpacity style={[styles.submit, { backgroundColor: accent }]} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{mode === "login" ? "Log in" : "Sign up"}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ marginTop: 16 }}>
                <Text style={[styles.switch, { color: accent }]}>
                    {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
                </Text>
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
    wrap: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    h: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 16 },
    hi: { fontSize: 22, fontWeight: "700", color: "#111" },
    email: { fontSize: 14, color: "#6b7280", marginTop: 2, marginBottom: 24 },
    label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#111" },
    submit: { borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 6 },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    switch: { textAlign: "center", fontSize: 14 },
    tile: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#eee" },
    tileText: { fontSize: 16, color: "#111" },
    chev: { fontSize: 22, color: "#9ca3af" },
    logout: { marginTop: 30, alignItems: "center" },
    logoutText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
});
