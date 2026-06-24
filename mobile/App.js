import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { initAnalytics, trackScreen } from "./src/analytics";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { StripeProvider } from "@stripe/stripe-react-native";
import { getConfig } from "./src/api";
import { StoreContext } from "./src/theme";
import { CartProvider, useCart } from "./src/cart";
import { AuthProvider } from "./src/auth";
import HomeScreen from "./src/screens/HomeScreen";
import ProductScreen from "./src/screens/ProductScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import SearchScreen from "./src/screens/SearchScreen";
import AccountScreen from "./src/screens/AccountScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import ConfirmationScreen from "./src/screens/ConfirmationScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon = (emoji) => ({ color }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;

function Tabs({ accent, storeName }) {
    const { count } = useCart();
    return (
        <Tab.Navigator screenOptions={{ tabBarActiveTintColor: accent, headerTitleStyle: { fontWeight: "700" } }}>
            <Tab.Screen name="Shop" component={HomeScreen} options={{ title: storeName, tabBarIcon: icon("🛍️") }} />
            <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: icon("🔍") }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: icon("🛒"), tabBarBadge: count || undefined }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: icon("👤") }} />
        </Tab.Navigator>
    );
}

// Bootstraps the store from /api/app/config, then renders the shop. The same binary is a different
// branded store depending on its build-time app key (resolved server-side).
export default function App() {
    const [cfg, setCfg] = useState(null);
    const [err, setErr] = useState(null);
    const navRef = useRef();
    const routeNameRef = useRef();

    useEffect(() => {
        initAnalytics();
        getConfig().then(setCfg).catch((e) => setErr(e.message || "load failed"));
    }, []);

    if (err) return <Centered><Text style={styles.muted}>Couldn't load the store. Try again later.</Text></Centered>;
    if (!cfg) return <Centered><ActivityIndicator size="large" /></Centered>;

    const accent = cfg.theme?.accent || "#f59e0b";
    const storeName = cfg.store?.name || "Shop";
    return (
        <StripeProvider publishableKey={cfg.stripePublishableKey || ""} merchantIdentifier="merchant.com.pythias">
            <StoreContext.Provider value={cfg}>
                <AuthProvider>
                    <CartProvider>
                        <NavigationContainer
                            ref={navRef}
                            onReady={() => {
                                const n = navRef.current?.getCurrentRoute()?.name;
                                routeNameRef.current = n;
                                if (n) trackScreen(`/${n.toLowerCase()}`);
                            }}
                            onStateChange={() => {
                                const cur = navRef.current?.getCurrentRoute()?.name;
                                if (cur && cur !== routeNameRef.current) { trackScreen(`/${cur.toLowerCase()}`); routeNameRef.current = cur; }
                            }}
                        >
                            <StatusBar style="dark" />
                            <Stack.Navigator screenOptions={{ headerTintColor: accent, headerTitleStyle: { fontWeight: "700" } }}>
                                <Stack.Screen name="Main" options={{ headerShown: false }}>
                                    {() => <Tabs accent={accent} storeName={storeName} />}
                                </Stack.Screen>
                                <Stack.Screen name="Product" component={ProductScreen} options={{ title: "" }} />
                                <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
                                <Stack.Screen name="Confirmation" component={ConfirmationScreen} options={{ title: "Order confirmed", headerBackVisible: false }} />
                                <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "My orders" }} />
                            </Stack.Navigator>
                        </NavigationContainer>
                    </CartProvider>
                </AuthProvider>
            </StoreContext.Provider>
        </StripeProvider>
    );
}

function Centered({ children }) { return <View style={styles.center}>{children}</View>; }
const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 30 },
    muted: { color: "#6b7280", textAlign: "center" },
});
