import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StripeProvider } from "@stripe/stripe-react-native";
import { getConfig } from "./src/api";
import { StoreContext } from "./src/theme";
import { CartProvider, useCart } from "./src/cart";
import HomeScreen from "./src/screens/HomeScreen";
import ProductScreen from "./src/screens/ProductScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";

const Stack = createNativeStackNavigator();

function CartButton({ navigation, accent }) {
    const { count } = useCart();
    return (
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={{ paddingHorizontal: 4 }}>
            <Text style={{ color: accent, fontWeight: "700", fontSize: 15 }}>Cart{count ? ` (${count})` : ""}</Text>
        </TouchableOpacity>
    );
}

// Bootstraps the store from /api/app/config, then renders the shop. The same binary is a different
// branded store depending on its build-time app key (resolved server-side).
export default function App() {
    const [cfg, setCfg] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => { getConfig().then(setCfg).catch((e) => setErr(e.message || "load failed")); }, []);

    if (err) return <Centered><Text style={styles.muted}>Couldn't load the store. Try again later.</Text></Centered>;
    if (!cfg) return <Centered><ActivityIndicator size="large" /></Centered>;

    const accent = cfg.theme?.accent || "#f59e0b";
    return (
        <StripeProvider publishableKey={cfg.stripePublishableKey || ""} merchantIdentifier="merchant.com.pythias">
            <StoreContext.Provider value={cfg}>
                <CartProvider>
                    <NavigationContainer>
                        <StatusBar style="dark" />
                        <Stack.Navigator
                            screenOptions={({ navigation }) => ({
                                headerTintColor: accent,
                                headerTitleStyle: { fontWeight: "700" },
                                headerRight: () => <CartButton navigation={navigation} accent={accent} />,
                            })}
                        >
                            <Stack.Screen name="Home" component={HomeScreen} options={{ title: cfg.store?.name || "Shop" }} />
                            <Stack.Screen name="Product" component={ProductScreen} options={{ title: "" }} />
                            <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Cart" }} />
                            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
                        </Stack.Navigator>
                    </NavigationContainer>
                </CartProvider>
            </StoreContext.Provider>
        </StripeProvider>
    );
}

function Centered({ children }) { return <View style={styles.center}>{children}</View>; }
const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 30 },
    muted: { color: "#6b7280", textAlign: "center" },
});
