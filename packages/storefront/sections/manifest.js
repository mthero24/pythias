// Editor schema for each section type: the label shown in the "add section" menu,
// the settings fields (drives the auto-generated settings form), and whether the
// section needs server data (so the data resolver knows what to fetch).
//
// field.type: "text" | "textarea" | "image" | "number" | "select" | "collage"
export const SECTION_MANIFEST = [
    {
        type: "hero",
        label: "Hero",
        needsData: false,
        fields: [
            { key: "headline", label: "Headline", type: "text" },
            { key: "subheadline", label: "Subheadline", type: "textarea" },
            { key: "height", label: "Height (px)", type: "number" },
            // Cropper frames to the hero's ratio (full width ÷ the height above) so you can pick the focal point.
            { key: "backgroundImage", label: "Background image", type: "imageCrop", heightKey: "height", refWidth: 1400, defaultHeight: 480 },
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
];

export const MANIFEST_BY_TYPE = Object.fromEntries(SECTION_MANIFEST.map((s) => [s.type, s]));
