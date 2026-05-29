export const PAPER_COLORS = {
  navy:        "#032358",
  black:       "#000000",
  brown:       "#5C3317",
  orange:      "#FF6600",
  blue:        "#020084",
  purple:      "#663399",
  charcoal:    "#464646",
  green:       "#0D8D4A",
  red:         "#FF0A00",
  pink:        "#FFBAD2",
  skyblue:     "#71D8EB",
  yellow:      "#FFFD02",
  limegreen:   "#5FF531",
  forest:      "#0B4813",
  hotpink:     "#FA01DB",
  white:       "#FFFFFF",
  "off white": "#F4F0EA",
  galaxy2:  { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy2.jpg" },
  galaxy1:  { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy1.jpg" },
  galaxy3:  { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy3.jpg" },
  wood:     { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-wood.jpg" },
  canvas:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-canvas.jpg" },
  rainbow:  { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-rainbow.jpg" },
  tiedye:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-tiedye.jpg" },
};

export const SUBLIMATION_COLORS = {
  navy:           "#030B5D",
  brown:          "#4E3200",
  black:          "#222222",
  aqua:           "#02C6E8",
  orange:         "#FF6401",
  blue:           "#0723E4",
  purple:         "#6001B5",
  charcoal:       "#585858",
  maroon:         "#870200",
  green:          "#10A048",
  red:            "#E40702",
  "light purple": "#AA86C5",
  sand:           "#D2CEB0",
  pink:           "#FFAAE7",
  skyblue:        "#71D8EB",
  yellow:         "#FFFD02",
  limegreen:      "#00F759",
  forest:         "#083C18",
  hotpink:        "#DF01CE",
  gold:           "#FEBB1C",
  white:          "#FFFFFF",
  silver:         "#CCCCCC",
  military:       "#4B5320",
  natral:         "#EED9B6",
};

const SUBLIMATION_PATTERNS = {
  christmaslights:  { url: "https://images2.teeshirtpalace.com/productBackgrounds/shutterstock_507541861.jpg" },
  christmasday:     { url: "https://images2.teeshirtpalace.com/productBackgrounds/shutterstock_751557958.jpg" },
  wood:             { url: "https://images2.teeshirtpalace.com/productBackgrounds/shutterstock_160286993.jpg" },
  whitechristmas:   { url: "https://images2.teeshirtpalace.com/productBackgrounds/whitechristmas-1.jpg" },
  snow:             { url: "https://images2.teeshirtpalace.com/productBackgrounds/snow.jpg" },
  "christmas lights": { url: "https://images2.teeshirtpalace.com/productBackgrounds/christmas-lights.jpg" },
};

export const ORNAMENT_COLORS = {
  ...SUBLIMATION_COLORS,
  ...SUBLIMATION_PATTERNS,
  "gold snow":    { url: "https://images2.teeshirtpalace.com/gold-snow.jpg" },
  "gold lights":  { url: "https://images2.teeshirtpalace.com/gold-lights.jpg" },
  "garland wood": { url: "https://images2.teeshirtpalace.com/garland-wood.jpg" },
  "gold wood":    { url: "https://images2.teeshirtpalace.com/gold-wood.jpg" },
};

export const SOCK_COLORS = { ...SUBLIMATION_COLORS, ...SUBLIMATION_PATTERNS };

export const COASTER_COLORS = {
  navy:      "#032358",
  black:     "#000000",
  brown:     "#4E3200",
  orange:    "#FF6600",
  blue:      "#020084",
  purple:    "#663399",
  charcoal:  "#464646",
  green:     "#0D8D4A",
  red:       "#FF0A00",
  pink:      "#FFBAD2",
  skyblue:   "#71D8EB",
  yellow:    "#FFFD02",
  limegreen: "#5FF531",
  forest:    "#0B4813",
  hotpink:   "#FA01DB",
  white:     "#FFFFFF",
  galaxy2:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy2.jpg" },
  galaxy1:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy1.jpg" },
  galaxy3:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-galaxy3.jpg" },
  wood:      { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-wood.jpg" },
  canvas:    { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-canvas.jpg" },
  rainbow:   { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-rainbow.jpg" },
  tiedye:    { url: "https://images2.teeshirtpalace.com/posterbg/poster-bg-tiedye.jpg" },
};

export const MOUSEPAD_COLORS = {
  ...SUBLIMATION_COLORS,
  camo:   { url: "https://images2.teeshirtpalace.com/catalog/msp/camo-msp-swatch.jpg" },
  tiedye: { url: "https://images2.teeshirtpalace.com/catalog/msp/tiedye-msp-swatch.jpg" },
};

export const BUTTON_COLORS = {
  ...PAPER_COLORS,
  swirl: { url: "https://images2.teeshirtpalace.com/posterbg/Marble%20Swirl%20Pattern%20Bkg%20(2).png" },
};

export function resolveColor(colorMap, name) {
  return colorMap[(name || "").toLowerCase()];
}
