// White-label Expo config. Each store's build injects EXPO_PUBLIC_* env (name, slug, bundle ids,
// app key, theme color, icon/splash) so one codebase produces a distinct branded app per store.
export default ({ config }) => ({
    ...config,
    name: process.env.EXPO_PUBLIC_STORE_NAME || "Pythias Store",
    slug: process.env.EXPO_PUBLIC_STORE_SLUG || "pythias-store",
    scheme: process.env.EXPO_PUBLIC_STORE_SCHEME || "pythiasstore",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: process.env.EXPO_PUBLIC_THEME_BG || "#ffffff",
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE || "store.pythias.placeholder",
    },
    android: {
        package: process.env.EXPO_PUBLIC_ANDROID_PKG || "store.pythias.placeholder",
        adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: process.env.EXPO_PUBLIC_THEME_BG || "#ffffff" },
    },
    extra: {
        // The store's tenant key (sent as x-pythias-app-key) + the storefront API base.
        appKey: process.env.EXPO_PUBLIC_APP_KEY || "",
        apiBase: process.env.EXPO_PUBLIC_API_BASE || "https://store.pythiastechnologies.com",
    },
});
