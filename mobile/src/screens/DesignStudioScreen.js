import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useStore } from "../theme";
import { useCart } from "../cart";

// Embeds the store's web design studio (/create-your-own?embed=1) in a WebView. When the buyer adds a
// design, the studio posts the cart line back (window.ReactNativeWebView.postMessage) and we add it to
// the app cart — it carries blankId + personalization, which checkout already handles as a custom line.
export default function DesignStudioScreen({ route, navigation }) {
    const store = useStore();
    const { add } = useCart();
    const productId = route?.params?.productId;

    const storeUrl = store?.store?.url;
    if (!storeUrl) return <View style={styles.center}><Text style={styles.muted}>The design studio isn't available for this store.</Text></View>;
    const uri = `${storeUrl}/create-your-own?embed=1${productId ? `&product=${encodeURIComponent(productId)}` : ""}`;

    const onMessage = (e) => {
        try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === "addToCart" && msg.line) {
                const l = msg.line;
                add({
                    ...l,
                    sku: l.customKey || l.sku,                                   // unique per design — don't merge lines
                    productId: undefined,
                    variantLabel: [l.color, l.size].filter(Boolean).join(" "),
                }, msg.qty || 1);
                navigation.navigate("Main", { screen: "Cart" });
            }
        } catch { /* ignore non-JSON messages */ }
    };

    return (
        <WebView
            source={{ uri }}
            onMessage={onMessage}
            startInLoadingState
            renderLoading={() => <View style={styles.center}><ActivityIndicator size="large" /></View>}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 30 },
    muted: { color: "#6b7280", textAlign: "center" },
});
