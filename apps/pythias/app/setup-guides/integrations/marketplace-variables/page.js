import Link from "next/link";
import s from "../docs.module.css";

export const metadata = {
    title: "Marketplace Column Variables — Pythias Setup Guides",
    description: "Complete reference for the dynamic variables available in the Pythias Add/Edit Marketplace modal: product variables, variant variables, and titleGenerator tokens.",
    alternates: { canonical: "https://pythiastechnologies.com/setup-guides/integrations/marketplace-variables" },
};

const PRODUCT_VARS = [
    { variable: "productSku", description: "The product-level SKU (base SKU, not variant-specific)", example: "SHIRT-001" },
    { variable: "productTitle", description: "The full product title from your Pythias catalog", example: "Unisex Heavy Cotton T-Shirt" },
    { variable: "productCategory", description: "The product category assigned in Pythias", example: "T-Shirts" },
    { variable: "productDescription", description: "Plain-text product description (HTML tags stripped)", example: "Premium 100% cotton tee..." },
    { variable: "productDescriptionHtml", description: "Full product description with HTML formatting preserved", example: "<p>Premium 100% cotton...</p>" },
    { variable: "productTags", description: "Comma-separated list of product tags", example: "cotton, unisex, everyday" },
    { variable: "productVendor", description: "The vendor/brand name assigned to the product", example: "Gildan" },
    { variable: "productBrand", description: "The brand field (may differ from vendor)", example: "Pythias Apparel" },
    { variable: "productTheme", description: "The product theme or collection name", example: "Summer 2025" },
    { variable: "productGender", description: "Gender target: Men, Women, Unisex, Kids, etc.", example: "Unisex" },
    { variable: "productSeason", description: "Season designation assigned in the product catalog", example: "All Season" },
    { variable: "productImage,0", description: "The first product image URL (index starts at 0). Change the number for other images.", example: "https://cdn.example.com/img/shirt-front.jpg" },
    { variable: "productImage,1", description: "The second product image URL", example: "https://cdn.example.com/img/shirt-back.jpg" },
    { variable: "productImageAlt", description: "Alt text for the main product image", example: "Unisex Heavy Cotton T-Shirt front view" },
    { variable: "productMarketPlaceId", description: "The existing marketplace listing ID for this product (useful for updates, not initial listing)", example: "B0XXXXXXXX" },
    { variable: "productSportUsedFor", description: "Sport or activity the product is designed for", example: "Running, Yoga" },
];

const VARIANT_VARS = [
    { variable: "variantColor", description: "The variant color name as stored in Pythias", example: "Black" },
    { variable: "variantSize", description: "The variant size (S, M, L, XL, 2XL, etc.)", example: "XL" },
    { variable: "variantSku", description: "The variant-level SKU (color + size specific)", example: "SHIRT-001-BLK-XL" },
    { variable: "variantPrice", description: "The listed price for this variant in dollars", example: "24.99" },
    { variable: "variantWeight", description: "Variant shipping weight (in pounds by default)", example: "0.5" },
    { variable: "variantUpc", description: "UPC (Universal Product Code) for this specific variant", example: "012345678901" },
    { variable: "variantGtin", description: "GTIN (Global Trade Item Number) — includes UPC, EAN, ISBN formats", example: "00012345678905" },
    { variable: "variantMarketPlaceId", description: "The existing marketplace listing ID for this specific variant", example: "ASIN-XXXXXXXX" },
    { variable: "variantImage", description: "The primary image URL for this variant (color-specific swatch image if available)", example: "https://cdn.example.com/img/shirt-black.jpg" },
    { variable: "variantImages,0", description: "First image in the variant's image array (use index for additional images)", example: "https://cdn.example.com/img/shirt-black-front.jpg" },
    { variable: "variantColorFamily", description: "The normalized color family for this variant (used for marketplace color filtering)", example: "Black" },
    { variable: "variantThreadColor", description: "The embroidery thread color for this variant (embroidery products only)", example: "Black 310" },
];

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "What happens if a variable has no value for a product?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "If a variable resolves to an empty value (because the field is not filled in on the product), Pythias will export that column as blank. Make sure the relevant fields are populated in your product catalog before running a marketplace export.",
            },
        },
        {
            "@type": "Question",
            name: "How do I use the productImage variable with a specific index?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Enter the variable as productImage,0 for the first image, productImage,1 for the second, and so on. The index is zero-based. If the product has fewer images than the index you specify, the column will be blank.",
            },
        },
        {
            "@type": "Question",
            name: "What are the titleGenerator tokens?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "The titleGenerator field in the marketplace modal supports three tokens: {color}, {blank}, and {size}. These are replaced per variant when the listing export or sync runs. For example, 'Custom {blank} in {color} - Size {size}' becomes 'Custom Gildan Tee in Black - Size XL' for that variant.",
            },
        },
    ],
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Setup Guides", item: "https://pythiastechnologies.com/setup-guides/integrations" },
        { "@type": "ListItem", position: 3, name: "Integrations", item: "https://pythiastechnologies.com/setup-guides/integrations" },
        { "@type": "ListItem", position: 4, name: "Marketplace Variables", item: "https://pythiastechnologies.com/setup-guides/integrations/marketplace-variables" },
    ],
};

export default function MarketplaceVariablesPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <nav className={s.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/setup-guides/integrations">Setup Guides</Link>
                <span>/</span>
                <Link href="/setup-guides/integrations">Integrations</Link>
                <span>/</span>
                <span style={{ color: "#374151" }}>Marketplace Variables</span>
            </nav>

            <header className={s.detailHero}>
                <div className={s.detailHeroInner}>
                    <div style={{ fontSize: "3rem" }}>🧩</div>
                    <div className={s.detailLogoText}>
                        <span className={s.detailChip}>Configuration Reference</span>
                        <h1 className={s.detailH1}>Marketplace Column Variables</h1>
                        <p className={s.detailOverview}>
                            When you set up or edit a marketplace in Pythias, each column in the CSV/listing export can be mapped to a dynamic variable that pulls data directly from your product catalog. This reference lists every available variable, what data it returns, and how to use it.
                        </p>
                    </div>
                </div>
            </header>

            <main className={s.detailBody}>

                {/* Where to use */}
                <section className={s.varSection}>
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>📍</span> Where to Use Variables</h2>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "16px" }}>
                        Variables are entered in the <strong>Add Marketplace</strong> or <strong>Edit Marketplace</strong> modal inside your Pythias admin dashboard. Navigate to <strong>Admin → Integrations → Add / Edit</strong> a marketplace connection.
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "16px" }}>
                        Inside the modal, each <strong>CSV Group</strong> has a list of columns (defined by the marketplace&apos;s header). For each column, you can set a <strong>Default Value</strong>. Enter the variable name exactly as shown below &mdash; Pythias will resolve it to the actual value for each product or variant when the export or sync runs.
                    </p>
                    <div className={s.infoBox}>
                        <strong>Tip:</strong> Variables are case-sensitive. Use <code>productTitle</code>, not <code>ProductTitle</code> or <code>product_title</code>.
                    </div>
                </section>

                {/* titleGenerator */}
                <section className={s.varSection}>
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>✏️</span> titleGenerator — Dynamic Listing Titles</h2>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "12px" }}>
                        The <strong>titleGenerator</strong> field in the marketplace modal is a special template field that lets you construct a per-variant listing title using token substitution. Set the <code>titleGenerator</code> column default value to a template string with any of these tokens:
                    </p>
                    <div className={s.tokenList}>
                        <span className={s.token}>{"{color}"}</span>
                        <span className={s.token}>{"{blank}"}</span>
                        <span className={s.token}>{"{size}"}</span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, margin: "12px 0" }}>
                        Each token is replaced with the actual value for that variant when Pythias runs the export. You can mix tokens with static text:
                    </p>
                    <div className={s.codeBox}>
                        <span className={s.cm}>{"// Template"}</span>{"\n"}
                        Custom {"{blank}"} in {"{color}"} — Size {"{size}"}{"\n\n"}
                        <span className={s.cm}>{"// Resolved per variant"}</span>{"\n"}
                        <span className={s.str}>Custom Gildan Tee in Black — Size XL</span>{"\n"}
                        <span className={s.str}>Custom Gildan Tee in White — Size M</span>{"\n"}
                        <span className={s.str}>Custom Gildan Tee in Navy — Size 2XL</span>
                    </div>
                    <table className={s.varTable}>
                        <thead>
                            <tr><th>Token</th><th>Replaced With</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{"{color}"}</td>
                                <td>The variant color name (e.g., Black, White, Heather Gray)</td>
                            </tr>
                            <tr>
                                <td>{"{blank}"}</td>
                                <td>The blank/product name (e.g., Gildan Heavy Cotton Tee, Bella+Canvas 3001)</td>
                            </tr>
                            <tr>
                                <td>{"{size}"}</td>
                                <td>The variant size (e.g., S, M, L, XL, 2XL, 3XL)</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Product variables */}
                <section className={s.varSection}>
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>📦</span> Product-Level Variables</h2>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "16px" }}>
                        These variables return values at the <strong>product level</strong> — the same value is used for all variants of a product.
                    </p>
                    <table className={s.varTable}>
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Description</th>
                                <th>Example Output</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PRODUCT_VARS.map(v => (
                                <tr key={v.variable}>
                                    <td>{v.variable}</td>
                                    <td>{v.description}</td>
                                    <td style={{ color: "#6b7280", fontFamily: "monospace", fontSize: "0.78rem" }}>{v.example}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Variant variables */}
                <section className={s.varSection}>
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>🎨</span> Variant-Level Variables</h2>
                    <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "16px" }}>
                        These variables return values specific to each <strong>variant</strong> (color + size combination). A single product with 20 variants will generate 20 different rows in the export, each with variant-specific values.
                    </p>
                    <table className={s.varTable}>
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Description</th>
                                <th>Example Output</th>
                            </tr>
                        </thead>
                        <tbody>
                            {VARIANT_VARS.map(v => (
                                <tr key={v.variable}>
                                    <td>{v.variable}</td>
                                    <td>{v.description}</td>
                                    <td style={{ color: "#6b7280", fontFamily: "monospace", fontSize: "0.78rem" }}>{v.example}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Syntax reference */}
                <section className={s.varSection}>
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>📝</span> Syntax Reference</h2>

                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "8px", marginTop: "20px" }}>
                        Simple variable (no parameter)
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7, marginBottom: "8px" }}>
                        Enter the variable name exactly as shown. No brackets, no dollar signs.
                    </p>
                    <div className={s.codeBox}>
                        <span className={s.cm}>{"// In the Default Value field for a column:"}</span>{"\n"}
                        productTitle{"\n"}
                        variantSku{"\n"}
                        variantPrice
                    </div>

                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "8px", marginTop: "28px" }}>
                        Variable with index parameter (images)
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7, marginBottom: "8px" }}>
                        For image variables, append a comma and the zero-based index number directly after the variable name. No spaces.
                    </p>
                    <div className={s.codeBox}>
                        <span className={s.cm}>{"// Main product image (first image, index 0)"}</span>{"\n"}
                        productImage,0{"\n\n"}
                        <span className={s.cm}>{"// Second product image"}</span>{"\n"}
                        productImage,1{"\n\n"}
                        <span className={s.cm}>{"// Variant-specific image"}</span>{"\n"}
                        variantImage{"\n\n"}
                        <span className={s.cm}>{"// Variant image array (first image)"}</span>{"\n"}
                        variantImages,0
                    </div>

                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "8px", marginTop: "28px" }}>
                        Mixing static text and variables
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7, marginBottom: "8px" }}>
                        The <code>titleGenerator</code> field supports mixing plain text with tokens. All other variable fields expect a <em>single variable name only</em> — you cannot combine a variable with static text in a regular column default value field.
                    </p>
                    <div className={s.codeBox}>
                        <span className={s.cm}>{"// ✓ Correct: titleGenerator field only"}</span>{"\n"}
                        <span className={s.kw}>titleGenerator</span>: <span className={s.str}>&quot;Custom {"{blank}"} in {"{color}"} - Size {"{size}"}&quot;</span>{"\n\n"}
                        <span className={s.cm}>{"// ✓ Correct: single variable in column default"}</span>{"\n"}
                        <span className={s.str}>productTitle</span>{"\n\n"}
                        <span className={s.cm}>{"// ✗ Not supported: mixing static + variable in column default"}</span>{"\n"}
                        <span className={s.cm}>{"// 'Custom ' + productTitle   ← won't work in a regular column"}</span>
                    </div>
                </section>

                {/* FAQ */}
                <section className={s.varSection} itemScope itemType="https://schema.org/FAQPage">
                    <h2 className={s.sectionTitle}><span className={s.sectionIcon}>❓</span> FAQ</h2>

                    <details
                        className={s.tip}
                        style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "0", listStyle: "none" }}
                        itemProp="mainEntity"
                        itemScope
                        itemType="https://schema.org/Question"
                    >
                        <summary
                            style={{ padding: "14px 18px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#111827" }}
                            itemProp="name"
                        >
                            What happens if a variable has no value for a product?
                        </summary>
                        <div
                            style={{ padding: "0 18px 14px", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7 }}
                            itemProp="acceptedAnswer"
                            itemScope
                            itemType="https://schema.org/Answer"
                        >
                            <span itemProp="text">
                                If a variable resolves to an empty value (the field is not filled in on the product), Pythias will export that column as blank. Make sure the relevant fields are populated in your product catalog before running a marketplace export.
                            </span>
                        </div>
                    </details>

                    <details
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", marginTop: "10px" }}
                        itemProp="mainEntity"
                        itemScope
                        itemType="https://schema.org/Question"
                    >
                        <summary
                            style={{ padding: "14px 18px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#111827" }}
                            itemProp="name"
                        >
                            Can I use multiple variables in the same column?
                        </summary>
                        <div
                            style={{ padding: "0 18px 14px", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7 }}
                            itemProp="acceptedAnswer"
                            itemScope
                            itemType="https://schema.org/Answer"
                        >
                            <span itemProp="text">
                                Standard column default value fields accept one variable. The only field that supports multiple tokens and static text is <strong>titleGenerator</strong>, which uses <code>{"{color}"}</code>, <code>{"{blank}"}</code>, and <code>{"{size}"}</code> tokens.
                            </span>
                        </div>
                    </details>

                    <details
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", marginTop: "10px" }}
                        itemProp="mainEntity"
                        itemScope
                        itemType="https://schema.org/Question"
                    >
                        <summary
                            style={{ padding: "14px 18px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#111827" }}
                            itemProp="name"
                        >
                            Where do I set the UPC and GTIN for a variant?
                        </summary>
                        <div
                            style={{ padding: "0 18px 14px", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7 }}
                            itemProp="acceptedAnswer"
                            itemScope
                            itemType="https://schema.org/Answer"
                        >
                            <span itemProp="text">
                                UPC and GTIN are set at the variant level in the product catalog. In Pythias admin, go to <strong>Admin → Products → Edit Product → Variants</strong>. Each variant row has a UPC field. Use <code>variantUpc</code> or <code>variantGtin</code> as the column variable to pull these values into the marketplace export.
                            </span>
                        </div>
                    </details>

                    <details
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", marginTop: "10px" }}
                        itemProp="mainEntity"
                        itemScope
                        itemType="https://schema.org/Question"
                    >
                        <summary
                            style={{ padding: "14px 18px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#111827" }}
                            itemProp="name"
                        >
                            How do I get multiple product images into separate columns?
                        </summary>
                        <div
                            style={{ padding: "0 18px 14px", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7 }}
                            itemProp="acceptedAnswer"
                            itemScope
                            itemType="https://schema.org/Answer"
                        >
                            <span itemProp="text">
                                Use indexed image variables for each image column. For example: set column <em>Image1</em> default value to <code>productImage,0</code>, set column <em>Image2</em> default value to <code>productImage,1</code>, and column <em>Image3</em> to <code>productImage,2</code>. Pythias will pull each image URL from the product&apos;s image array by position.
                            </span>
                        </div>
                    </details>
                </section>

                <p style={{ marginTop: 40 }}>
                    <Link href="/setup-guides/integrations" style={{ color: "#6366f1", fontWeight: 600, fontSize: "0.9rem" }}>
                        ← Back to all integrations
                    </Link>
                </p>
            </main>

            <section className={s.cta}>
                <div style={{ textAlign: "center" }}>
                    <h2 className={s.ctaTitle}>Questions about marketplace setup?</h2>
                    <p className={s.ctaSub}>Our team can walk you through the configuration live on a demo call.</p>
                    <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</Link>
                </div>
            </section>
        </div>
    );
}
