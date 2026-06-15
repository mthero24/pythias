// Pure (client-safe) storefront rendering primitives — no DB access here.
// Used by both the public storefront app and the in-app section editor preview.
export { default as SiteFrame } from "./components/SiteFrame";
export { default as SectionRenderer } from "./components/SectionRenderer";
export { default as ProductCard } from "./components/ProductCard";
export { default as SiteScripts, productJsonLd } from "./components/SiteScripts";
export { SECTION_REGISTRY, SECTION_TYPES } from "./sections/registry";
export { SECTION_MANIFEST, MANIFEST_BY_TYPE } from "./sections/manifest";
export { themeVars } from "./lib/theme";
export { THEME_PRESETS, PRESET_BY_ID, applyPreset } from "./themes/presets";
