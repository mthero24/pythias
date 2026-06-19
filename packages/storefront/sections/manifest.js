// Editor schema for each section type: the label shown in the "add section" menu,
// the settings fields (drives the auto-generated settings form), and whether the
// section needs server data (so the data resolver knows what to fetch).
//
// field.type: "text" | "textarea" | "image" | "images" | "number" | "select" | "collage" | "color"
export const SECTION_MANIFEST = [
    {
        type: "hero",
        label: "Hero",
        needsData: false,
        fields: [
            { key: "headline", label: "Headline", type: "text" },
            { key: "subheadline", label: "Subheadline", type: "textarea" },
            { key: "height", label: "Height (px)", type: "number" },
            // Background color — used as a solid backdrop, or as the canvas behind a transparent overlay.
            { key: "backgroundColor", label: "Background color", type: "color" },
            // Cropper frames to the hero's ratio (full width ÷ the height above) so you can pick the focal point.
            { key: "backgroundImage", label: "Background image", type: "imageCrop", heightKey: "height", refWidth: 1400, defaultHeight: 480 },
            // Foreground images layered on top of the background (e.g. product cut-outs) — a centered showcase row.
            { key: "overlayImages", label: "Overlay images (on top)", type: "images" },
            { key: "ctaText", label: "Button text", type: "text" },
            { key: "ctaLink", label: "Button link", type: "text" },
            { key: "align", label: "Alignment", type: "select", options: ["left", "center", "right"] },
        ],
    },
    {
        type: "featuredProducts",
        label: "Featured products",
        needsData: true,
        fields: [
            { key: "heading", label: "Heading", type: "text" },
            // Optional search to curate the grid (e.g. "christmas", "valentines", "game day").
            { key: "query", label: "Search / filter (optional)", type: "text" },
            { key: "sort", label: "Sort by", type: "select", options: ["featured", "newest", "best sellers", "price: low to high", "price: high to low"] },
            { key: "limit", label: "How many", type: "number" },
        ],
    },
    {
        type: "richText",
        label: "Text block",
        needsData: false,
        fields: [
            { key: "heading", label: "Heading", type: "text" },
            { key: "body", label: "Body", type: "textarea" },
            { key: "align", label: "Alignment", type: "select", options: ["left", "center", "right"] },
        ],
    },
    {
        type: "imageCollage",
        label: "Image collage",
        needsData: false,
        fields: [
            { key: "heading", label: "Heading (optional)", type: "text" },
            { key: "subheading", label: "Subheading (optional)", type: "text" },
            // Row-based layout builder: rows of clickable image tiles. type "collage" → CollageField.
            { key: "rows", label: "Layout", type: "collage" },
        ],
    },
    {
        type: "customHtml",
        label: "Custom HTML",
        needsData: false,
        // type "html" → a code editor + AI assistant (describe it / iterate). Rendered sanitized.
        fields: [
            { key: "html", label: "HTML", type: "html" },
        ],
    },
    {
        type: "collection",
        label: "Collection",
        needsData: true,
        // type "collection" → a picker of the store's published collections. Renders that collection's
        // curated, auto-updating product grid.
        fields: [
            { key: "collectionId", label: "Collection", type: "collection" },
            { key: "heading", label: "Heading (optional — defaults to the collection name)", type: "text" },
            { key: "limit", label: "How many", type: "number" },
        ],
    },
];

export const MANIFEST_BY_TYPE = Object.fromEntries(SECTION_MANIFEST.map((s) => [s.type, s]));
