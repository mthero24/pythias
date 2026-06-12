import Link from "next/link";

export const metadata = {
    title: "Developer API — Pythias Technologies",
    description: "Connect your own storefront to Pythias. Sync products and designs, send orders to be fulfilled, and receive status webhooks. API reference and integration guide.",
    alternates: { canonical: "https://pythiastechnologies.com/developer" },
};

const BASE_URL = "https://platform.pythiastechnologies.com/api/partner";
const DARK  = "#0f172a";
const GOLD  = "#D3A73D";
const GRAY  = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.08)";

const ENDPOINTS = [
    {
        method: "GET", path: "/products", label: "List Products",
        desc: "List products in your Pythias catalog.",
        params: [
            { name: "page",     type: "number", desc: "Page number. Default: 1" },
            { name: "pageSize", type: "number", desc: "Items per page (max 100). Default: 50" },
            { name: "sku",      type: "string", desc: "Filter by exact product or variant SKU" },
            { name: "search",   type: "string", desc: "Full-text search across title and SKU" },
        ],
        response: `{
  "products": [
    {
      "id": "6649abc123...",
      "title": "Classic Tee",
      "sku": "TSHIRT-001",
      "brand": "Acme",
      "images": ["https://cdn.example.com/tee.png"],
      "variants": [
        { "sku": "TSHIRT-001-BLK-L", "price": 12.50,
          "color": "Black", "size": "L",
          "image": "https://cdn.example.com/tee-blk.png", "upc": "0123..." }
      ],
      "lastUpdated": "2026-06-11T14:00:00.000Z"
    }
  ],
  "total": 120, "page": 1, "pages": 3
}`,
    },
    {
        method: "GET", path: "/products/:sku", label: "Get Product",
        desc: "Fetch a single product by product-level or variant SKU.",
        params: [],
        response: `{ "product": { "id": "...", "title": "...", "sku": "...", "variants": [ ... ] } }`,
    },
    {
        method: "POST", path: "/products", label: "Upsert Products",
        desc: "Create or update products in your catalog, keyed by SKU. Send a single product object or an array. Your storefront is the source of truth — re-post to update.",
        body: [
            { name: "sku",      type: "string", required: true, desc: "Product-level SKU (upsert key)" },
            { name: "title",    type: "string", desc: "Product title" },
            { name: "brand",    type: "string", desc: "Brand name" },
            { name: "description", type: "string", desc: "Product description" },
            { name: "images",   type: "string[]", desc: "Product image URLs" },
            { name: "variants", type: "object[]", required: true, desc: "Variants: { sku*, price, color, size, image, upc }" },
        ],
        response: `{
  "success": true,
  "upserted": [{ "sku": "TSHIRT-001", "id": "6649...", "created": true }],
  "count": 1
}`,
    },
    {
        method: "GET", path: "/designs", label: "List Designs",
        desc: "List designs in your Pythias catalog.",
        params: [
            { name: "page",     type: "number", desc: "Page number. Default: 1" },
            { name: "pageSize", type: "number", desc: "Items per page (max 100). Default: 50" },
            { name: "sku",      type: "string", desc: "Filter by exact design SKU" },
            { name: "search",   type: "string", desc: "Search name, SKU, and tags" },
        ],
        response: `{
  "designs": [
    { "id": "6649...", "sku": "DSGN-1", "name": "Logo",
      "printType": "DTF", "tags": ["summer"],
      "images": { ... }, "published": true }
  ],
  "total": 8, "page": 1, "pages": 1
}`,
    },
    {
        method: "GET", path: "/designs/:sku", label: "Get Design",
        desc: "Fetch a single design by SKU.",
        params: [],
        response: `{ "design": { "id": "...", "sku": "...", "name": "...", "printType": "DTF" } }`,
    },
    {
        method: "POST", path: "/designs", label: "Upload Designs",
        desc: "Create or update designs, keyed by SKU. Send a single design or an array. Design SKUs are globally unique.",
        body: [
            { name: "sku",       type: "string", required: true, desc: "Design SKU (upsert key, globally unique)" },
            { name: "name",      type: "string", required: true, desc: "Design name" },
            { name: "printType", type: "string", desc: 'Print method e.g. "DTF", "Sublimation", "Embroidery"' },
            { name: "tags",      type: "string[]", desc: "Search tags" },
            { name: "images",    type: "object", desc: "Design artwork (keyed by location/side)" },
            { name: "embroideryFiles", type: "object", desc: "Embroidery files (e.g. DST) by location" },
        ],
        response: `{
  "success": true,
  "upserted": [{ "sku": "DSGN-1", "id": "6649...", "created": true }],
  "count": 1
}`,
    },
    {
        method: "GET", path: "/orders", label: "List Orders",
        desc: "List orders you have sent to Pythias.",
        params: [
            { name: "status",   type: "string", desc: "Filter by status e.g. awaiting_shipment | shipped | cancelled" },
            { name: "page",     type: "number", desc: "Page number. Default: 1" },
            { name: "pageSize", type: "number", desc: "Items per page (max 100). Default: 50" },
        ],
        response: `{
  "orders": [
    {
      "id": "6649abc123...",
      "orderId": "PARTNER-1718...-A1B2",
      "poNumber": "PO-1001",
      "status": "awaiting_shipment",
      "customerEmail": "jane@store.com",
      "total": 23.00, "productCost": 25.00,
      "shippingCost": 5.00, "discountAmount": 2.00, "discountName": "WELCOME",
      "shippingAddress": { "name": "Jane Smith", "address1": "123 Main St",
        "city": "Detroit", "state": "MI", "zip": "48201", "country": "US" },
      "date": "2026-06-11T14:00:00.000Z"
    }
  ],
  "total": 12, "page": 1, "pages": 1
}`,
    },
    {
        method: "GET", path: "/orders/:orderId", label: "Get Order",
        desc: "Fetch a single order by Pythias id, your orderId, or poNumber. Includes per-item pricing and discounts.",
        params: [],
        response: `{
  "order": {
    "id": "6649...", "poNumber": "PO-1001", "status": "awaiting_shipment",
    "total": 23.00, "shippingCost": 5.00, "discountAmount": 2.00,
    "items": [
      { "sku": "TSHIRT-001-BLK-L", "name": "Classic Tee",
        "colorName": "Black", "sizeName": "L", "quantity": "1",
        "status": "awaiting_shipment", "price": 12.50, "discount": 1.00 }
    ]
  }
}`,
    },
    {
        method: "POST", path: "/orders", label: "Create Order",
        desc: "Send an order to be fulfilled. A line item is either a catalog line (matched by SKU) or a custom line that ships its own design artwork — so the product does not need to exist in our system. If a catalog SKU can't be matched, the whole order is rejected and nothing is created.",
        body: [
            { name: "poNumber",       type: "string", required: true, desc: "Your purchase-order / order number" },
            { name: "customerEmail",  type: "string", desc: "End-customer email" },
            { name: "shippingAddress", type: "object", required: true, desc: "{ name*, address1*, city*, country*, state, zip, phone, address2 }" },
            { name: "shippingCost",   type: "number", desc: "Shipping amount you were paid" },
            { name: "discountAmount", type: "number", desc: "Order-level discount total" },
            { name: "discountName",   type: "string", desc: "Order-level discount label" },
            { name: "items",          type: "object[]", required: true, desc: "Catalog line: { sku*, quantity*, price, discount }. Custom line: { quantity*, design* (artwork by side), styleCode, colorName, sizeName, printType, name, price, discount }" },
        ],
        response: `{ "success": true, "orderId": "6649...", "poNumber": "PO-1001" }

// Custom line example (no product needed — garment resolved from styleCode):
{ "poNumber": "PO-1002",
  "shippingAddress": { "name": "Jane", "address1": "1 Main St",
    "city": "Detroit", "country": "US" },
  "items": [{
    "quantity": 1, "price": 18.00,
    "design": { "front": "https://cdn.you/art-front.png",
                "back":  "https://cdn.you/art-back.png" },
    "styleCode": "1566", "colorName": "Black", "sizeName": "L",
    "printType": "DTF", "name": "Custom Tee"
  }]
}`,
    },
];

const WEBHOOK_EVENTS = [
    { event: "order.received",  desc: "Pythias received and accepted an order you sent for fulfillment." },
    { event: "order.updated",   desc: "An order's details changed on our side." },
    { event: "order.shipped",   desc: "An order shipped. Tracking is included in the payload." },
    { event: "order.delivered", desc: "An order was marked delivered." },
    { event: "order.cancelled", desc: "An order was cancelled." },
    { event: "product.updated", desc: "A product in your catalog changed on our side — upsert it on yours." },
    { event: "design.updated",  desc: "A design in your catalog changed on our side — upsert it on yours." },
];

function Badge({ method }) {
    const colors = { GET: "#22c55e", POST: "#3b82f6", DELETE: "#ef4444", PUT: "#f59e0b" };
    return (
        <span style={{ background: colors[method] || "#64748b", color: "#fff", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em", flexShrink: 0 }}>
            {method}
        </span>
    );
}

function Code({ children, lang = "json" }) {
    return (
        <pre style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px", overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.6, color: "#e2e8f0", margin: "12px 0 0" }}>
            <code>{children}</code>
        </pre>
    );
}

function ParamTable({ rows }) {
    if (!rows?.length) return null;
    return (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", marginTop: 12 }}>
            {rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 80px 1fr", gap: "0 16px", padding: "10px 16px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "start" }}>
                    <code style={{ color: GOLD, fontSize: "0.82rem" }}>{r.name}{r.required ? <span style={{ color: "#f87171" }}>*</span> : ""}</code>
                    <span style={{ color: "#64748b", fontSize: "0.78rem" }}>{r.type}</span>
                    <span style={{ color: GRAY, fontSize: "0.82rem" }}>{r.desc}</span>
                </div>
            ))}
        </div>
    );
}

export default function DeveloperPage() {
    return (
        <main style={{ background: DARK, minHeight: "100vh" }}>
            {/* Hero */}
            <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "72px 24px 56px" }}>
                <div style={{ maxWidth: 860, margin: "0 auto" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Developer Docs</p>
                    <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16 }}>
                        Partner API Reference
                    </h1>
                    <p style={{ fontSize: "1.05rem", color: GRAY, lineHeight: 1.75, maxWidth: 600, marginBottom: 32 }}>
                        Connect your own storefront to Pythias. Sync your products and designs, send orders to be fulfilled, and receive webhooks whenever something changes on our side.
                    </p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link href="https://platform.pythiastechnologies.com" style={{ background: GOLD, color: "#0f172a", fontWeight: 700, fontSize: "0.875rem", padding: "12px 24px", borderRadius: 9, textDecoration: "none" }}>
                            Get API Keys →
                        </Link>
                        <Link href="/partner-terms" style={{ border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.875rem", padding: "12px 24px", borderRadius: 9, textDecoration: "none" }}>
                            Partner Terms
                        </Link>
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 48 }}>

                {/* Authentication */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Authentication</h2>
                    <p style={{ color: GRAY, lineHeight: 1.75, marginBottom: 16 }}>All requests must include your API key in the Authorization header. Generate keys in your platform account under <strong style={{ color: "#fff" }}>Integrations → Partner API</strong>.</p>
                    <Code>{`Authorization: Bearer pk_live_your_api_key_here`}</Code>
                    <p style={{ color: GRAY, fontSize: "0.875rem", marginTop: 12 }}>API keys start with <code style={{ color: GOLD }}>pk_live_</code>. Keep them secret — treat them like passwords. Rotate keys immediately if compromised.</p>
                </section>

                {/* Base URL */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Base URL</h2>
                    <Code>{BASE_URL}</Code>
                </section>

                {/* Endpoints */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 24 }}>Endpoints</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {ENDPOINTS.map((ep, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 28px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                    <Badge method={ep.method} />
                                    <code style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>{ep.path}</code>
                                    <span style={{ color: GRAY, fontSize: "0.85rem", marginLeft: "auto" }}>{ep.label}</span>
                                </div>
                                <p style={{ color: GRAY, fontSize: "0.875rem", marginBottom: ep.params?.length || ep.body?.length ? 12 : 0 }}>{ep.desc}</p>
                                {ep.params?.length > 0 && (
                                    <>
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Query Parameters</p>
                                        <ParamTable rows={ep.params} />
                                    </>
                                )}
                                {ep.body?.length > 0 && (
                                    <>
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, marginTop: 12 }}>Request Body</p>
                                        <ParamTable rows={ep.body} />
                                    </>
                                )}
                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, marginTop: 12 }}>Response</p>
                                <Code>{ep.response}</Code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Webhooks */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Webhooks</h2>
                    <p style={{ color: GRAY, lineHeight: 1.75, marginBottom: 24 }}>Configure a webhook URL in your platform account (<strong style={{ color: "#fff" }}>Integrations → Partner API → Webhook</strong>). Pythias will POST signed JSON payloads to your URL whenever your orders, products, or designs change on our side — so you can keep your storefront in sync.</p>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Events</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                        {WEBHOOK_EVENTS.map(e => (
                            <div key={e.event} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                                <code style={{ color: GOLD, fontSize: "0.85rem" }}>{e.event}</code>
                                <span style={{ color: GRAY, fontSize: "0.875rem" }}>{e.desc}</span>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Payload structure</h3>
                    <Code>{`{
  "event": "order.shipped",
  "sentAt": "2026-06-11T14:00:00.000Z",
  "data": {
    "id": "6649abc123...",
    "orderId": "PARTNER-1718...-A1B2",
    "poNumber": "PO-1001",
    "status": "shipped",
    "total": 23.00,
    "items": [ ... ]
  }
}`}</Code>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 12, marginTop: 28 }}>Verifying signatures</h3>
                    <p style={{ color: GRAY, lineHeight: 1.75, marginBottom: 12 }}>Every webhook includes an <code style={{ color: GOLD }}>X-Pythias-Signature</code> header. Verify it to confirm the request came from Pythias.</p>
                    <Code lang="js">{`// Node.js example
const crypto = require("crypto");

function verifyWebhook(rawBody, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
app.post("/webhook/pythias", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-pythias-signature"];
  if (!verifyWebhook(req.body, sig, process.env.PYTHIAS_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }
  const { event, data } = JSON.parse(req.body);
  // handle event...
  res.json({ received: true });
});`}</Code>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 12, marginTop: 28 }}>Retry policy</h3>
                    <p style={{ color: GRAY, lineHeight: 1.75 }}>Pythias retries failed webhook deliveries (non-2xx response or timeout) up to 3 times with exponential backoff: 1 minute, 5 minutes, 30 minutes. Your endpoint must respond within 10 seconds. Return a <code style={{ color: GOLD }}>2xx</code> status to acknowledge receipt.</p>
                </section>

                {/* Quick start */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Quick Start</h2>
                    <Code lang="js">{`const BASE = "https://platform.pythiastechnologies.com/api/partner";
const headers = {
  Authorization: "Bearer pk_live_your_key",
  "Content-Type": "application/json"
};

// 1. Push a product into your Pythias catalog
await fetch(\`\${BASE}/products\`, {
  method: "POST", headers,
  body: JSON.stringify({
    sku: "TSHIRT-001",
    title: "Classic Tee",
    variants: [
      { sku: "TSHIRT-001-BLK-L", price: 12.50, color: "Black", size: "L" }
    ]
  })
});

// 2. (Optional) Upload a design
await fetch(\`\${BASE}/designs\`, {
  method: "POST", headers,
  body: JSON.stringify({ sku: "DSGN-1", name: "Logo", printType: "DTF" })
});

// 3. Send an order to be fulfilled (lines matched by SKU)
await fetch(\`\${BASE}/orders\`, {
  method: "POST", headers,
  body: JSON.stringify({
    poNumber: "PO-1001",
    customerEmail: "jane@store.com",
    shippingCost: 5.00,
    shippingAddress: {
      name: "Jane Smith", address1: "123 Main St",
      city: "Detroit", state: "MI", zip: "48201", country: "US"
    },
    items: [
      { sku: "TSHIRT-001-BLK-L", quantity: 2, price: 12.50 }
    ]
  })
});

// 4. Receive an order.shipped webhook when it ships
app.post("/webhook/pythias", (req, res) => {
  const { event, data } = req.body;
  if (event === "order.shipped") {
    console.log("Shipped:", data.poNumber);
    // mark fulfilled in your store...
  }
  res.json({ received: true });
});`}</Code>
                </section>

                {/* Error codes */}
                <section>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Error Codes</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { code: 401, msg: "Unauthorized", desc: "Missing or invalid API key" },
                            { code: 400, msg: "Bad Request",  desc: "Missing required fields, or an order with SKUs that don't match your catalog (see unresolvedSkus in the response)" },
                            { code: 404, msg: "Not Found",    desc: "Resource not found or doesn't belong to your account" },
                            { code: 409, msg: "Conflict",     desc: "Design SKU already exists — design SKUs are globally unique" },
                            { code: 429, msg: "Rate Limited", desc: "Too many requests — max 120 requests/minute" },
                            { code: 500, msg: "Server Error", desc: "Contact support if this persists" },
                        ].map(e => (
                            <div key={e.code} style={{ display: "grid", gridTemplateColumns: "60px 140px 1fr", gap: 16, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                                <code style={{ color: e.code >= 500 ? "#f87171" : e.code >= 400 ? "#fbbf24" : GOLD, fontSize: "0.875rem", fontWeight: 700 }}>{e.code}</code>
                                <span style={{ color: "#fff", fontSize: "0.875rem" }}>{e.msg}</span>
                                <span style={{ color: GRAY, fontSize: "0.875rem" }}>{e.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32 }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
                        Need help? <Link href="/contact" style={{ color: GOLD, textDecoration: "none" }}>Contact us</Link> or email support@pythiastechnologies.com.
                    </p>
                </div>
            </div>
        </main>
    );
}
