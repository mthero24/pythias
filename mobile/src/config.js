import Constants from "expo-constants";

// Per-store config injected at build time via app.config.js `extra`.
const extra = Constants.expoConfig?.extra || {};
export const APP_KEY = extra.appKey || "";
export const API_BASE = extra.apiBase || "https://store.pythiastechnologies.com";
