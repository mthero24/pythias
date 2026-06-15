// Editor schema for each section type: the label shown in the "add section" menu,
// the settings fields (drives the auto-generated settings form), and whether the
// section needs server data (so the data resolver knows what to fetch).
//
// field.type: "text" | "textarea" | "image" | "number" | "select"
export const SECTION_MANIFEST = [
    {
        type: "hero",
        label: "Hero",
        needsData: false,
        fields: [
            { key: "headline", label: "Headline", type: "text" },
            { key: "subheadline", label: "Subheadline", type: "textarea" },
            { key: "backgroundImage", label: "Background image", type: "image" },
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
];

export const MANIFEST_BY_TYPE = Object.fromEntries(SECTION_MANIFEST.map((s) => [s.type, s]));
