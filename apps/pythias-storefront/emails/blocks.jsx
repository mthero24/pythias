// React Email block components for the seller email builder. The composer stores an array of
// blocks ({ type, ...props }); renderBlocks() (lib/email.js) turns them into HTML via React Email,
// which is then wrapped in the EmailShell. Buttons are real <Button href> so CTAs are always linked.
import { Heading, Text, Button, Img, Hr, Section } from "@react-email/components";

export const EMAIL_BLOCK_TYPES = [
    { type: "heading",  label: "Heading" },
    { type: "text",     label: "Text" },
    { type: "button",   label: "Button" },
    { type: "image",    label: "Image" },
    { type: "products", label: "Products" },
    { type: "order_summary",  label: "Order summary" },
    { type: "review_buttons", label: "Review buttons" },
    { type: "divider",  label: "Divider" },
    { type: "spacer",   label: "Spacer" },
];

// Reusable product card — fed by a generic item shape so it works for the email builder's
// "products" block (catalog search) AND abandoned-cart emails (the customer's cart).
// item = { title, image, price, url, qty? }
export function ProductCard({ item = {} }) {
    return (
        <Section style={{ border: "1px solid #eeeeee", borderRadius: "10px", overflow: "hidden", margin: "0 0 12px" }}>
            {item.image ? <Img src={item.image} alt={item.title || ""} style={{ width: "100%", maxWidth: "512px", display: "block" }} /> : null}
            <Section style={{ padding: "12px 14px" }}>
                <Text style={{ fontWeight: 700, fontSize: "15px", lineHeight: "1.3", margin: "0 0 4px", color: "#111111" }}>{item.title || ""}</Text>
                {item.price ? <Text style={{ color: "#111111", fontSize: "14px", margin: "0 0 10px" }}>{item.price}{item.qty > 1 ? ` · Qty ${item.qty}` : ""}</Text> : null}
                {item.url ? (
                    <Button href={item.url} style={{ backgroundColor: "#111111", color: "#ffffff", padding: "9px 18px", borderRadius: "6px", fontWeight: 700, fontSize: "14px", textDecoration: "none", display: "inline-block" }}>View</Button>
                ) : null}
            </Section>
        </Section>
    );
}

// Stand-alone helper so non-block emails (abandoned cart) can render a list of items the same way.
export function ProductCardList({ items = [] }) {
    return <>{items.map((it, i) => <ProductCard key={i} item={it} />)}</>;
}

function Block({ b }) {
    switch (b?.type) {
        case "heading":
            return <Heading as="h2" style={{ fontSize: b.size || "22px", fontWeight: 700, lineHeight: "1.3", margin: "0 0 12px", textAlign: b.align || "left" }}>{b.text || ""}</Heading>;
        case "text":
            return <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 14px", textAlign: b.align || "left", color: "#333333" }}>{b.text || ""}</Text>;
        case "button":
            return (
                <Section style={{ textAlign: b.align || "left", margin: "18px 0" }}>
                    <Button href={b.href || "#"} style={{ backgroundColor: b.color || "#111111", color: "#ffffff", padding: "12px 22px", borderRadius: "8px", fontWeight: 700, fontSize: "15px", textDecoration: "none", display: "inline-block" }}>
                        {b.label || "Shop now"}
                    </Button>
                </Section>
            );
        case "image":
            return b.src ? <Img src={b.src} alt={b.alt || ""} style={{ width: "100%", maxWidth: "512px", borderRadius: "8px", margin: "0 0 14px", display: "block" }} /> : null;
        case "products":
            // b.items are resolved server-side (catalog search by b.query, or explicit ids) before render.
            return (
                <Section style={{ margin: "8px 0 14px" }}>
                    {b.heading ? <Heading as="h3" style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px" }}>{b.heading}</Heading> : null}
                    {(b.items || []).map((it, j) => <ProductCard key={j} item={it} />)}
                </Section>
            );
        case "order_summary":
            // Post-purchase: this order's line items (filled at send time). Empty → preview placeholder.
            return (
                <Section style={{ margin: "8px 0 14px" }}>
                    {b.heading ? <Heading as="h3" style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px" }}>{b.heading}</Heading> : null}
                    {(b.items && b.items.length) ? (
                        <Section style={{ border: "1px solid #eeeeee", borderRadius: "10px", padding: "10px 14px" }}>
                            {b.items.map((it, j) => (
                                <Text key={j} style={{ fontSize: "14px", margin: "4px 0", color: "#333333" }}>{it.title}{it.qty > 1 ? ` × ${it.qty}` : ""}</Text>
                            ))}
                        </Section>
                    ) : <Text style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0" }}>Your order items will appear here.</Text>}
                </Section>
            );
        case "review_buttons":
            // Post-purchase: a "Leave a review" button per product (filled at send time).
            return (
                <Section style={{ margin: "8px 0 14px" }}>
                    {b.heading ? <Heading as="h3" style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px" }}>{b.heading}</Heading> : null}
                    {(b.products && b.products.length) ? b.products.map((p, j) => (
                        <Section key={j} style={{ margin: "0 0 10px" }}>
                            <Text style={{ fontSize: "14px", margin: "0 0 6px", color: "#333333" }}>{p.title}</Text>
                            <Button href={p.url || "#"} style={{ backgroundColor: b.color || "#111111", color: "#ffffff", padding: "9px 18px", borderRadius: "6px", fontWeight: 700, fontSize: "14px", textDecoration: "none", display: "inline-block" }}>{b.label || "Leave a review"}</Button>
                        </Section>
                    )) : <Text style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0" }}>A review button for each item will appear here.</Text>}
                </Section>
            );
        case "divider":
            return <Hr style={{ borderColor: "#eeeeee", borderTopWidth: "1px", margin: "18px 0" }} />;
        case "spacer":
            return <Section style={{ height: `${parseInt(b.height) || 24}px`, lineHeight: `${parseInt(b.height) || 24}px`, fontSize: "1px" }}>&nbsp;</Section>;
        default:
            return null;
    }
}

export function BlockContent({ blocks = [] }) {
    return (
        <>
            {blocks.map((b, i) => <Block key={i} b={b} />)}
        </>
    );
}
