import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { getConfig } from "./src/api";
import { StoreContext } from "./src/theme";
import HomeScreen from "./src/screens/HomeScreen";
import ProductScreen from "./src/screens/ProductScreen";

const Stack = createNativeStackNavigator();

// Bootstraps the store from /api/app/config, then renders the shop. Branding/theme come from config,
// so the same binary is a different branded store depending on its build-time app key.
export default function App() {
    const [cfg, setCfg] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        getConfig().then(setCfg).catch((e) => setErr(e.message || "load failed"));
    }, []);

    if (err) return <Centered><Text style={styles.muted}>Couldn't load the store. Pull to retry.</Text></Centered>;
    if (!cfg) return <Centered><ActivityIndicator size="large" /></Centered>;

    const accent = cfg.theme?.accent || "#f59e0b";
    return (
        <StoreContext.Provider value={cfg}>
            <NavigationContainer>
                <StatusBar style="dark" />
                <Stack.Navigator screenOptions={{ headerTintColor: accent, headerTitleStyle: { fontWeight: "700" } }}>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ title: cfg.store?.name || "Shop" }} />
                    <Stack.Screen name="Product" component={ProductScreen} options={{ title: "" }} />
                </Stack.Navigator>
            </NavigationContainer>
        </StoreContext.Provider>
    );
}

function Centered({ children }) {
    return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    muted: { color: "#6b7280" },
});
