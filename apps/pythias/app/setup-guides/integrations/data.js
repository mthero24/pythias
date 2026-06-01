export const INTEGRATIONS = [
    // ─── Major Marketplaces ─────────────────────────────────────────────────────
    {
        slug: "shopify",
        name: "Shopify",
        logo: "/Shopify_logo_2018.png",
        logoBg: "#96bf48",
        category: "Your Own Store",
        highlight: "App Store",
        overview: "Shopify is the fastest integration to activate. Install the official Pythias app from the Shopify App Store and every new order automatically routes into your production queue — no manual export or copy-paste required. Fulfilled orders get tracking pushed back to Shopify, which notifies the customer automatically.",
        prerequisites: [
            "Active Shopify store (any plan)",
            "Shopify account with admin access",
            "Active Pythias account",
        ],
        steps: [
            {
                title: "Install the Pythias Shopify App",
                content: "Go to <a href='https://apps.shopify.com/pythias-app' target='_blank' rel='noopener'>apps.shopify.com/pythias-app</a> and click <strong>Add app</strong>. You will be redirected to your Shopify admin to approve the installation. Click <strong>Install app</strong> to grant Pythias the required permissions (read/write orders, products, shipping, customers).",
            },
            {
                title: "Log into Pythias and go to Integrations",
                content: "In your Pythias dashboard, navigate to <strong>Admin → Integrations</strong>. Click <strong>Add New Integration</strong>. Select <strong>Shopify</strong> from the list of platforms.",
            },
            {
                title: "Enter your Shopify store URL",
                content: "In the connection form, enter your Shopify store's myshopify domain — for example: <code>yourstore.myshopify.com</code>. Do not include <code>https://</code>. Then click <strong>Connect</strong>. Pythias will verify the connection using the installed app's access token.",
            },
            {
                title: "Configure order routing",
                content: "Once connected, choose which production queue incoming Shopify orders should route to by default (e.g., DTF, Embroidery, Sublimation). You can also set SKU-based routing rules so each product goes to the correct production type automatically.",
            },
            {
                title: "Test with a sample order",
                content: "Create a test order in your Shopify admin (<strong>Orders → Create order</strong>). Within a few minutes, the order should appear in your Pythias production queue. Fulfill it in Pythias and confirm that the tracking number is pushed back to Shopify.",
            },
        ],
        whatSyncs: [
            "Incoming orders (pulled every 2–5 minutes)",
            "Order line items, quantities, SKUs, and customer details",
            "Shipping carrier and tracking number (pushed back when fulfilled)",
            "Order fulfillment status (marked as fulfilled on Shopify)",
            "Product listings (optional, via marketplace listing sync)",
        ],
        tips: [
            "If orders are not appearing, verify the app is still installed in your Shopify admin under Settings → Apps.",
            "Make sure your Pythias account has the Shopify integration enabled in your subscription plan.",
            "SKU-based routing rules are set in Admin → Edit Data → SKU Routing.",
            "For stores with high order volume, contact Pythias support to enable webhook mode for near-instant sync.",
        ],
    },
    {
        slug: "amazon",
        name: "Amazon",
        logo: "/amazon.png",
        category: "Major Marketplaces",
        highlight: "SP-API",
        overview: "Amazon uses the Selling Partner API (SP-API) for all order and fulfillment operations. You connect Pythias by authorizing it as an SP-API application via Amazon Seller Central. Once connected, Pythias pulls unshipped FBM orders, routes them to production, and confirms shipment with carrier and tracking back to Amazon — satisfying Amazon's strict fulfillment SLA requirements.",
        prerequisites: [
            "Active Amazon Seller Central account (Professional selling plan recommended)",
            "FBM (Fulfilled by Merchant) listings — Pythias handles merchant fulfillment, not FBA",
            "Amazon account with administrator permissions",
        ],
        steps: [
            {
                title: "Log into Amazon Seller Central",
                content: "Go to <strong>sellercentral.amazon.com</strong> and sign in with your seller account credentials. Make sure you are in the correct marketplace region (US, EU, etc.) where your FBM orders originate.",
            },
            {
                title: "Navigate to the SP-API Authorization page",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Amazon</strong>. Click <strong>Connect with Amazon</strong>. Pythias will redirect you to Amazon Seller Central's authorization page where you grant the Pythias application access to your selling account.",
            },
            {
                title: "Approve the permission request",
                content: "On the Amazon authorization page, review the permissions being requested: <em>Orders</em> (read/write), <em>Shipping</em> (read/write), and <em>Catalog Items</em> (read). Click <strong>Confirm</strong> to authorize. You will be redirected back to Pythias.",
            },
            {
                title: "Select your marketplace region(s)",
                content: "After authorization, Pythias will ask which Amazon marketplace(s) to sync (e.g., Amazon.com, Amazon.ca, Amazon.co.uk). Select all regions where you have active FBM listings and click <strong>Save</strong>.",
            },
            {
                title: "Set fulfillment defaults",
                content: "Configure the default shipping carrier and service level (e.g., USPS First Class, USPS Priority) that Pythias will report back to Amazon. Amazon requires confirmed carrier name and tracking number when you mark an order as shipped.",
            },
            {
                title: "Verify with a live order",
                content: "If you have a pending unshipped order, it should appear in Pythias within the next pull cycle (every 5–10 minutes). Process it in production, ship it, and confirm that Amazon marks the order as <strong>Shipped</strong> with the correct tracking number in Seller Central.",
            },
        ],
        whatSyncs: [
            "Unshipped FBM orders (pulled every 5–10 minutes)",
            "Order items, ASIN, SKU, quantity, and buyer shipping address",
            "Shipment confirmation with carrier, service, and tracking number",
            "Order status updates (Unshipped → Shipped)",
            "Amazon shipping label rate quotes (optional, via Amazon Buy Shipping)",
        ],
        tips: [
            "Amazon has strict Late Shipment Rate (LSR) requirements. Set up Pythias order alerts so you see urgent orders immediately.",
            "If you sell on multiple Amazon marketplaces (US + Canada + UK), add each as a separate region in the integration settings.",
            "Amazon's SP-API tokens expire and refresh automatically. If orders stop pulling, re-authorize the integration from Admin → Integrations.",
            "For Amazon Buy Shipping, enable it in the integration settings to purchase labels directly through Amazon and auto-confirm the order.",
        ],
    },
    {
        slug: "walmart",
        name: "Walmart",
        logo: "/walmart.png",
        category: "Major Marketplaces",
        highlight: "Full API",
        overview: "Walmart Marketplace uses a Client ID / Client Secret authentication model. Once connected, Pythias acknowledges new orders, routes them to production, ships them, and pushes tracking back to Walmart — all automatically. Pythias also supports Walmart's listing management and feed tracking APIs so you can push product updates from one place.",
        prerequisites: [
            "Approved Walmart Marketplace seller account",
            "API credentials created in Walmart Seller Center (Client ID and Client Secret)",
        ],
        steps: [
            {
                title: "Open Walmart Seller Center API Settings",
                content: "Log into <strong>seller.walmart.com</strong>. In the top navigation, go to <strong>Settings (gear icon) → API Settings</strong>. If you do not see API Settings, your account may need to be approved for API access — contact Walmart Seller Support.",
            },
            {
                title: "Create a new API integration",
                content: "On the API Settings page, click <strong>Create Integration</strong>. Give it a name like \"Pythias Fulfillment\". Select the permissions you need: <em>Orders</em>, <em>Shipping</em>, and optionally <em>Items</em> (for listing management). Click <strong>Save</strong>.",
            },
            {
                title: "Copy your Client ID and Client Secret",
                content: "After creating the integration, Walmart will display your <strong>Client ID</strong> and <strong>Client Secret</strong>. Copy both values immediately — the Client Secret is only shown once. Store them securely before navigating away.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Walmart</strong>. Paste the Client ID and Client Secret into the corresponding fields. Click <strong>Test Connection</strong> to verify. If the test passes, click <strong>Save</strong>.",
            },
            {
                title: "Configure acknowledgment and shipping settings",
                content: "Walmart requires sellers to acknowledge orders within 4 hours of receipt. In the Pythias Walmart integration settings, enable <strong>Auto-Acknowledge</strong> to have Pythias acknowledge new orders immediately upon pull. Set your default shipping carrier (USPS, FedEx, or UPS).",
            },
        ],
        whatSyncs: [
            "New orders (pulled every 5 minutes, auto-acknowledged)",
            "Order line items, item IDs, SKUs, quantities, and shipping address",
            "Shipment confirmation with carrier, tracking number, and ship date",
            "Order status updates (Acknowledged → Shipped → Delivered)",
            "Product listing updates via Item Feed API (optional)",
        ],
        tips: [
            "Walmart's 4-hour acknowledgment window is strict — enable Auto-Acknowledge to avoid cancellations.",
            "If your Client Secret is lost, revoke the integration in Seller Center and create a new one.",
            "Walmart tracks your On-Time Shipping Rate. Use Pythias order urgency alerts to flag orders approaching their ship-by date.",
            "For Walmart international (Walmart.ca), create a separate integration entry with Canadian marketplace credentials.",
        ],
    },
    {
        slug: "target-plus",
        name: "Target Plus",
        logo: "/target-logo.png",
        category: "Major Marketplaces",
        highlight: "Direct API",
        overview: "Target Plus is Target's invite-only third-party marketplace. Integration uses Target's Partner API to pull purchase orders, acknowledge receipt, and confirm shipment. Target Plus has strict compliance requirements including mandatory EDI acknowledgment windows and precise carrier code reporting.",
        prerequisites: [
            "Accepted Target Plus partnership invitation",
            "Target Partner credentials (Organization ID and API Token) from your Target Partner onboarding team",
            "Approved carrier accounts (Target Plus requires specific carrier codes)",
        ],
        steps: [
            {
                title: "Obtain Target Partner API credentials",
                content: "During Target Plus onboarding, your Target partner representative will provide your <strong>Organization ID</strong> and an initial <strong>API Token</strong>. If you need to generate a new token, log into the Target Partner Portal and go to <strong>Settings → API Access → Generate Token</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Target Plus</strong>. Enter your <strong>Organization ID</strong> and <strong>API Token</strong>. Click <strong>Test Connection</strong>. If the test is successful, click <strong>Save</strong>.",
            },
            {
                title: "Configure acknowledgment settings",
                content: "Target Plus requires purchase orders to be acknowledged within 24 hours. Enable <strong>Auto-Acknowledge</strong> in the integration settings. Set the acknowledgment response to <strong>ACCEPTED</strong> for orders you can fulfill.",
            },
            {
                title: "Map Target carrier codes",
                content: "Target Plus uses specific carrier codes in the shipment confirmation (e.g., <code>USPS</code>, <code>FEDEX</code>, <code>UPS</code>). In the integration settings, map each Pythias carrier to the correct Target carrier code. This step is required — incorrect codes will cause shipment confirmation failures.",
            },
            {
                title: "Process a test order",
                content: "Target will typically send test purchase orders during your onboarding period. Process one through Pythias end-to-end: pull → acknowledge → fulfill → ship → confirm. Verify with your Target partner representative that the acknowledgment and shipment confirmation were received correctly.",
            },
        ],
        whatSyncs: [
            "Purchase orders (pulled every 10 minutes)",
            "Order line items, TCIN (Target item numbers), quantities, and shipping address",
            "Order acknowledgment (accepted or rejected) sent back to Target",
            "Shipment confirmation with carrier, tracking, and ship date",
        ],
        tips: [
            "Target Plus compliance is strictly monitored — late acknowledgment or shipment confirmation can result in account review.",
            "Target requires ASN (Advanced Shipment Notice) format for some order types. Pythias handles this automatically when enabled.",
            "Carrier codes must exactly match Target's approved carrier list. Contact Pythias support if a carrier you use is not mapped.",
        ],
    },
    {
        slug: "ebay",
        name: "eBay",
        logo: "/ebay.svg",
        category: "Major Marketplaces",
        highlight: "Full API",
        overview: "Pythias connects to eBay via the eBay Sell API using OAuth 2.0. After a one-click authorization, Pythias pulls paid orders, ships them, and pushes tracking back to eBay. The integration also supports listing management, finance data, buyer messaging, and feedback review — all from the Pythias dashboard.",
        prerequisites: [
            "Active eBay seller account",
            "eBay account must be in good standing (not restricted)",
        ],
        steps: [
            {
                title: "Start the eBay OAuth flow in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → eBay</strong>. Click <strong>Connect with eBay</strong>. You will be redirected to eBay's sign-in page.",
            },
            {
                title: "Sign in to eBay and authorize Pythias",
                content: "Sign in with your eBay seller account. On the authorization screen, review the permissions Pythias is requesting: <em>Sell Orders</em>, <em>Sell Fulfillment</em>, <em>Sell Inventory</em>, <em>Sell Finances</em>, and <em>Sell Analytics</em>. Click <strong>Agree</strong> to authorize.",
            },
            {
                title: "Select your eBay site(s)",
                content: "After authorization, Pythias will ask which eBay site(s) to sync (eBay.com, eBay.co.uk, eBay.de, etc.). Select all sites where you have active listings and click <strong>Save</strong>.",
            },
            {
                title: "Configure fulfillment defaults",
                content: "Set your default shipping carrier and service for eBay orders. eBay requires tracking numbers to be uploaded within 1 business day of payment for Seller Protection. Enable the <strong>Auto-upload tracking</strong> option in the integration settings.",
            },
        ],
        whatSyncs: [
            "Paid orders (pulled every 5 minutes)",
            "Order items, eBay item IDs, SKUs, quantity, and buyer shipping address",
            "Shipment confirmation with carrier, tracking number, and ship date",
            "Order status updates (Awaiting Shipment → Shipped)",
            "Buyer messages (read in Pythias, optional)",
            "Finance data and payout summaries (read-only)",
        ],
        tips: [
            "eBay OAuth tokens expire after 18 months. Pythias will alert you before expiry so you can re-authorize without interruption.",
            "Upload tracking within 1 business day to maintain eBay Seller Protection coverage on all transactions.",
            "If you sell on multiple eBay sites, each site uses the same OAuth token — select all applicable sites in the integration settings.",
        ],
    },
    {
        slug: "wayfair",
        name: "Wayfair",
        logo: "/wayfair.svg",
        category: "Major Marketplaces",
        highlight: "GraphQL API",
        overview: "Wayfair uses a GraphQL-based Supplier API for dropship purchase orders. Pythias polls for new purchase orders, acknowledges them, routes to production, and submits shipment confirmation via Wayfair's ASN (Advance Ship Notice) workflow. Wayfair is best suited for home goods, furniture accessories, and décor products.",
        prerequisites: [
            "Active Wayfair Supplier account (invitation-based)",
            "Wayfair Extranet access (extranet.wayfair.com)",
            "API credentials (Supplier ID and API token) from Wayfair Supplier Onboarding team",
        ],
        steps: [
            {
                title: "Log into Wayfair Extranet",
                content: "Go to <strong>extranet.wayfair.com</strong> and sign in. Navigate to <strong>My Account → API Access</strong>. If you do not see API Access, contact your Wayfair supplier account manager.",
            },
            {
                title: "Generate your API token",
                content: "On the API Access page, click <strong>Generate Token</strong>. Wayfair will create a Bearer token for your account. Copy this token and store it securely — it will be used for all API calls.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Wayfair</strong>. Enter your <strong>Supplier ID</strong> (found in your Wayfair Extranet profile) and the <strong>API Token</strong> you generated. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure ASN and shipping settings",
                content: "Wayfair requires an Advance Ship Notice (ASN) for every shipment. In the integration settings, configure your default carrier (USPS, FedEx, UPS) and packaging defaults. Pythias will generate the ASN automatically when you ship an order.",
            },
        ],
        whatSyncs: [
            "Purchase orders (polled every 10 minutes)",
            "Order items, Wayfair SKU, quantities, and shipping destination",
            "Purchase order acknowledgment (accepted/rejected)",
            "ASN (Advance Ship Notice) with carrier, tracking, package details",
            "Invoice submission to Wayfair for payment processing",
        ],
        tips: [
            "Wayfair has strict compliance metrics (On-Time Delivery, No-Defect Rate). Fulfill orders by the Expected Ship Date shown in each order.",
            "If your API token expires or is revoked, regenerate it in Wayfair Extranet and update the token in Pythias integration settings.",
            "Wayfair's GraphQL sandbox environment is available for testing — contact Pythias support to enable sandbox mode before going live.",
        ],
    },
    {
        slug: "etsy",
        name: "Etsy",
        logo: "/etsy.jpeg",
        category: "Boutique & Handmade",
        highlight: "OAuth API",
        overview: "Etsy uses OAuth 2.0 for authorization. A one-click connect links your Etsy shop to Pythias. New paid orders (receipts) are pulled automatically, processed in production, and marked as shipped on Etsy with your tracking number — satisfying Etsy's Star Seller shipping requirements.",
        prerequisites: [
            "Active Etsy seller account with at least one active listing",
            "Etsy shop must be in good standing",
        ],
        steps: [
            {
                title: "Start the Etsy OAuth flow",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Etsy</strong>. Click <strong>Connect with Etsy</strong>. You will be redirected to Etsy's login page.",
            },
            {
                title: "Sign in to Etsy and grant access",
                content: "Log in with your Etsy account. On the permissions screen, Pythias will request access to: <em>read your listings</em>, <em>read and update your transactions (orders)</em>, and <em>update shipping information</em>. Click <strong>Allow access</strong>.",
            },
            {
                title: "Select your Etsy shop",
                content: "If you manage multiple Etsy shops under one account, Pythias will list them. Select the shop(s) you want to connect to this Pythias account and click <strong>Save</strong>.",
            },
            {
                title: "Test the connection",
                content: "Pythias will pull the last 10 open transactions from Etsy to verify the connection. Check that your recent paid, unshipped orders appear in the Pythias order queue. If they do not appear, check that they are in <strong>Paid</strong> or <strong>Processing</strong> status on Etsy (not <strong>Complete</strong> or <strong>Cancelled</strong>).",
            },
        ],
        whatSyncs: [
            "Paid receipts / open transactions (pulled every 5 minutes)",
            "Line items including listing title, personalization notes, quantity, and shipping address",
            "Shipment tracking uploaded to Etsy receipt (marks order as shipped)",
            "Order completion status update",
        ],
        tips: [
            "Etsy OAuth tokens are long-lived but can be revoked by the seller. If orders stop pulling, re-authorize from Admin → Integrations.",
            "Personalization notes (custom text orders) are included in the order details — make sure your team checks the notes column in the production queue.",
            "Etsy's Star Seller program requires shipping within your handling time. Set Pythias alerts for orders approaching their ship-by date.",
            "If you have digital + physical items in the same shop, use SKU-based routing rules to separate digital listings from physical production orders.",
        ],
    },
    {
        slug: "faire",
        name: "Faire",
        logo: "/faire.svg",
        category: "Boutique & Handmade",
        highlight: "Wholesale",
        overview: "Faire is a wholesale marketplace connecting independent brands with boutique retailers. Pythias connects via Faire's Brand API using an API token. Wholesale orders are pulled, routed to production in bulk quantities, and fulfilled with shipment confirmation and tracking pushed back to Faire.",
        prerequisites: [
            "Active Faire Brand account (brands sell on Faire; retailers buy)",
            "API token from Faire Brand Portal",
        ],
        steps: [
            {
                title: "Generate a Faire API Token",
                content: "Log into your Faire Brand Portal at <strong>faire.com/brand-portal</strong>. Navigate to <strong>Settings → Integrations → API Access</strong>. Click <strong>Generate API Token</strong>. Copy the token — it begins with <code>FAIRE_</code>.",
            },
            {
                title: "Enter the token in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Faire</strong>. Paste the API token into the <strong>API Token</strong> field. Click <strong>Test Connection</strong>. If successful, click <strong>Save</strong>.",
            },
            {
                title: "Configure wholesale order settings",
                content: "Faire orders are often larger quantities per line item than typical retail orders. In the integration settings, set your default production queue for wholesale orders and configure any minimum batch size settings for DTF or other production methods.",
            },
        ],
        whatSyncs: [
            "New wholesale orders from retailers (pulled every 10 minutes)",
            "Order line items, SKUs, quantities, and retailer shipping address",
            "Shipment tracking and carrier pushed back to Faire",
            "Order fulfillment status update on Faire",
        ],
        tips: [
            "Faire orders may have Net 60 payment terms — check your Faire payment schedule, as orders are paid out differently than retail platforms.",
            "If your API token is revoked (after password change or security review), regenerate it in Faire Brand Portal and update in Pythias.",
            "Faire provides free shipping on first orders for new retailers — configure your default carrier accordingly.",
        ],
    },
    {
        slug: "tiktok-shop",
        name: "TikTok Shop",
        logo: "/tiktok.jpeg",
        category: "Social Commerce",
        highlight: "Shop API",
        overview: "TikTok Shop connects your seller account via OAuth through the TikTok Shop Open Platform. Pythias pulls new orders from TikTok Shop, routes them to production, and confirms shipment with tracking — meeting TikTok's strict Late Shipment Rate (LSR) requirements. Orders can arrive from TikTok Live events, shoppable videos, or the Shop tab.",
        prerequisites: [
            "Active TikTok Shop seller account (US or other supported region)",
            "TikTok Shop account approved for selling",
        ],
        steps: [
            {
                title: "Start the TikTok Shop OAuth flow",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → TikTok Shop</strong>. Click <strong>Connect with TikTok Shop</strong>. You will be redirected to TikTok's authorization page.",
            },
            {
                title: "Authorize Pythias on TikTok Shop",
                content: "Sign in with your TikTok Seller Center account. TikTok will show the permissions Pythias is requesting: <em>Orders management</em>, <em>Shipping management</em>, and <em>Products management</em> (optional). Click <strong>Confirm authorization</strong>.",
            },
            {
                title: "Select your TikTok Shop",
                content: "If your TikTok account manages multiple shops, select the shop you want to connect. Click <strong>Save</strong>.",
            },
            {
                title: "Configure shipping settings",
                content: "TikTok Shop has strict fulfillment windows (typically 2 business days). In the Pythias TikTok integration settings, enable urgency flags for orders approaching the fulfillment deadline. Set your default carrier for TikTok orders.",
            },
        ],
        whatSyncs: [
            "New paid orders (pulled every 5 minutes)",
            "Order items, product SKUs, quantities, personalization, and shipping address",
            "Package tracking confirmation pushed to TikTok Shop",
            "Order status update (Awaiting Shipment → Shipped)",
        ],
        tips: [
            "TikTok Shop's Late Shipment Rate (LSR) threshold is 2%. Fulfill all orders within the required window to maintain seller standing.",
            "TikTok OAuth tokens expire. Pythias will notify you 7 days before expiry so you can re-authorize.",
            "During TikTok Live events, order volume can spike dramatically. Monitor your Pythias production queue during scheduled lives.",
            "If you use TikTok's in-house shipping (TikTok Shipping), Pythias can pull the pre-generated label URL for printing.",
        ],
    },
    {
        slug: "shein",
        name: "SHEIN",
        logo: "/shein.svg",
        category: "Social Commerce",
        highlight: "Open Platform",
        overview: "SHEIN's Open Platform API enables authorized third-party sellers to receive purchase orders, confirm acknowledgment, and submit shipment confirmation with tracking. Access is invite-only — you must apply through SHEIN's vendor onboarding process before connecting.",
        prerequisites: [
            "Accepted SHEIN vendor account (apply at shein.com/partner)",
            "SHEIN Open Platform credentials: App ID and App Secret (provided by SHEIN during onboarding)",
        ],
        steps: [
            {
                title: "Obtain SHEIN Open Platform credentials",
                content: "During SHEIN vendor onboarding, your SHEIN account manager will provide your <strong>App ID</strong> and <strong>App Secret</strong>. If you need to retrieve them, log into the SHEIN Seller Center and go to <strong>Account Settings → Open Platform → API Credentials</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → SHEIN</strong>. Enter your <strong>App ID</strong> and <strong>App Secret</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure order acknowledgment",
                content: "SHEIN requires purchase orders to be acknowledged within a defined window. Enable <strong>Auto-Acknowledge</strong> in the Pythias SHEIN integration settings to prevent missed acknowledgment deadlines.",
            },
            {
                title: "Map SHEIN SKUs to Pythias products",
                content: "SHEIN uses its own internal SKU system. In <strong>Admin → Edit Data</strong>, map each SHEIN product ID to the corresponding Pythias product SKU so orders route to the correct design and production type.",
            },
        ],
        whatSyncs: [
            "Purchase orders (polled every 10 minutes)",
            "Order items, SHEIN product IDs, quantities, and shipping destination",
            "Order acknowledgment (accepted/rejected)",
            "Shipment tracking confirmation pushed to SHEIN",
        ],
        tips: [
            "SHEIN SKU mapping is critical — orders with unmapped SKUs will appear in Pythias as unrouted and require manual intervention.",
            "SHEIN's compliance scoring monitors acknowledgment rate and on-time shipment rate. Maintain above 95% on both metrics.",
            "Contact Pythias support if your SHEIN App Secret is rotated — you will need to update the credential in the integration settings.",
        ],
    },
    {
        slug: "temu",
        name: "Temu",
        logo: "/temu.svg",
        category: "Social Commerce",
        highlight: "POP API",
        overview: "Temu's Partner Open Platform (POP) API allows authorized sellers to receive purchase orders and confirm shipments. Pythias uses your Temu App Key and App Secret to poll for new orders and automatically confirm fulfillment once shipped.",
        prerequisites: [
            "Active Temu seller account with Open Platform API access approved",
            "Temu POP API credentials: App Key and App Secret",
        ],
        steps: [
            {
                title: "Apply for Temu Open Platform access",
                content: "Log into <strong>seller.temu.com</strong>. Navigate to <strong>My Account → Developer Center → Apply for Open Platform</strong>. Complete the application form describing your integration use case. Approval typically takes 3–5 business days.",
            },
            {
                title: "Generate your App Key and App Secret",
                content: "Once approved, go to <strong>Developer Center → My Apps → Create New App</strong>. Provide an app name and description. After creation, your <strong>App Key</strong> and <strong>App Secret</strong> will be displayed. Copy both values.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Temu</strong>. Enter your <strong>App Key</strong> and <strong>App Secret</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure order sync settings",
                content: "Set up Temu order routing in <strong>Admin → Edit Data → SKU Routing</strong>. Map Temu product IDs to your Pythias product catalog so orders route to the correct production queue automatically.",
            },
        ],
        whatSyncs: [
            "New purchase orders (polled every 10 minutes)",
            "Order items, Temu SKUs, quantities, and buyer shipping address",
            "Shipment confirmation with carrier and tracking number",
            "Order fulfillment status update",
        ],
        tips: [
            "Temu has extremely competitive pricing expectations. Make sure your production costs are calculated correctly before listing.",
            "Keep your App Secret confidential — do not share it. Rotate it in Temu Developer Center if you suspect it has been compromised.",
            "For high-volume Temu orders, contact Pythias support to discuss batch processing optimizations.",
        ],
    },
    {
        slug: "meta-shops",
        name: "Meta Shops",
        logo: "/meta.svg",
        category: "Social Commerce",
        highlight: "Shop API",
        overview: "Meta Shops allows you to sell across Facebook Shop and Instagram Shopping from a single product catalog. Pythias connects via the Meta Commerce Platform API using Facebook OAuth. Orders placed through Facebook or Instagram checkout flow directly into your production queue.",
        prerequisites: [
            "Facebook Business Manager account",
            "Facebook Shop enabled on your Facebook Page or Instagram Business account",
            "Commerce account set up in Meta Commerce Manager (commerce.facebook.com)",
        ],
        steps: [
            {
                title: "Open Meta OAuth in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Meta Shops</strong>. Click <strong>Connect with Facebook</strong>. You will be redirected to Facebook's login and permissions page.",
            },
            {
                title: "Grant Commerce Manager permissions",
                content: "Sign in with the Facebook account that has admin access to your Business Manager. When prompted, select the <strong>Business Manager</strong> and <strong>Commerce account</strong> you want to connect. Grant Pythias access to: <em>Manage orders</em> and <em>Manage shipping</em>. Click <strong>Continue</strong>.",
            },
            {
                title: "Select your shop",
                content: "Pythias will list the Facebook Shops associated with your Commerce account. Select the shop you want to sync orders from and click <strong>Save</strong>.",
            },
            {
                title: "Configure shipping and fulfillment",
                content: "Meta requires tracking numbers to be uploaded within 3 days of the estimated ship date. In the integration settings, configure your default carrier and enable <strong>Auto-upload tracking</strong>.",
            },
        ],
        whatSyncs: [
            "Orders placed via Facebook Checkout or Instagram Checkout",
            "Order items, product IDs, quantities, and buyer shipping address",
            "Shipment tracking pushed to Meta Commerce Manager",
            "Order fulfillment status update (fulfillment confirmations sent to buyer)",
        ],
        tips: [
            "Meta Shops orders can come from both Facebook and Instagram — both funnel into the same Commerce account.",
            "Facebook OAuth tokens are long-lived but can expire or be revoked. Re-authorize if orders stop appearing.",
            "Product catalog sync (listing products to your Facebook Shop) is separate from order fulfillment — manage listings in Meta Commerce Manager or via the Pythias catalog publishing feature.",
        ],
    },
    {
        slug: "pinterest",
        name: "Pinterest Shopping",
        logo: "/pinterest.svg",
        category: "Social Commerce",
        highlight: "Shopping API",
        overview: "Pinterest Shopping allows you to tag products in Pins and enable direct checkout through Pinterest's native shopping experience. Pythias connects via Pinterest's API v5 using OAuth to sync your product catalog and pull shopping orders.",
        prerequisites: [
            "Pinterest Business account",
            "Pinterest Shopping enabled (apply at business.pinterest.com)",
            "Verified website with product feed configured",
        ],
        steps: [
            {
                title: "Enable Pinterest Shopping on your account",
                content: "Log into <strong>business.pinterest.com</strong>. Go to <strong>Ads → Catalogs</strong> to confirm your product catalog feed is set up. If you haven't applied for Pinterest Shopping yet, complete the application at <strong>business.pinterest.com/shopping</strong>.",
            },
            {
                title: "Connect Pinterest in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Pinterest</strong>. Click <strong>Connect with Pinterest</strong>. Sign in with your Pinterest Business account and grant Pythias access to: <em>Read and write boards, pins, and product catalogs</em>, and <em>Read and write orders</em>.",
            },
            {
                title: "Select your catalog and shop",
                content: "After authorization, Pythias will display your Pinterest Business accounts and catalogs. Select the catalog linked to your shoppable products and click <strong>Save</strong>.",
            },
        ],
        whatSyncs: [
            "Product catalog (synced from Pythias to Pinterest, optional)",
            "Shopping orders placed via Pinterest Checkout",
            "Order items, product IDs, quantities, and buyer shipping address",
            "Shipment tracking pushed to Pinterest order",
        ],
        tips: [
            "Pinterest Shopping orders are lower volume than Amazon or Walmart — but have higher intent buyers. Keep your catalog fresh and accurately priced.",
            "If your product feed URL changes, update it in Pinterest Catalogs to avoid stale inventory listings.",
        ],
    },
    {
        slug: "wix",
        name: "Wix",
        logo: "/wix.svg",
        category: "Your Own Store",
        highlight: "REST API",
        overview: "Wix stores connect to Pythias via an API key generated in your Wix Dashboard. Once connected, new store orders are pulled into Pythias automatically and fulfilled orders have their tracking numbers pushed back to Wix — updating the buyer's order status and triggering Wix's shipment notification email.",
        prerequisites: [
            "Active Wix store (Wix Business or eCommerce plan required)",
            "Wix account with site admin access",
        ],
        steps: [
            {
                title: "Generate a Wix API Key",
                content: "Log into your Wix account at <strong>manage.wix.com</strong>. Click on your site, then go to <strong>Settings → Advanced → API Keys</strong>. Click <strong>Generate API Key</strong>. Give it a name like \"Pythias Integration\". Under <em>Select Permissions</em>, enable: <strong>Wix Stores</strong> → All Permissions. Click <strong>Generate Key</strong>.",
            },
            {
                title: "Copy the API Key and Site ID",
                content: "After generation, copy the <strong>API Key</strong> (displayed once — store it securely). Your <strong>Site ID</strong> can be found in the URL of your Wix Dashboard (<code>manage.wix.com/dashboard/<strong>SITE-ID-HERE</strong>/...</code>) or under <strong>Settings → Site ID</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Wix</strong>. Enter your <strong>API Key</strong> and <strong>Site ID</strong>. Click <strong>Test Connection</strong> to verify. If successful, click <strong>Save</strong>.",
            },
            {
                title: "Configure fulfillment settings",
                content: "Set your default carrier for Wix orders in the integration settings. Pythias will push the carrier name and tracking number back to Wix when an order is marked as shipped, which triggers Wix's built-in tracking notification email to the buyer.",
            },
        ],
        whatSyncs: [
            "New store orders (pulled every 5 minutes)",
            "Order line items, product IDs, variants, quantities, and buyer shipping address",
            "Shipment tracking and carrier pushed to Wix order",
            "Fulfillment status update (order marked as fulfilled in Wix)",
        ],
        tips: [
            "Wix API keys do not expire, but if you revoke one (or it is auto-revoked after a password change), you will need to generate a new key and update Pythias.",
            "Make sure the Wix Stores permission is fully enabled for the API key — read-only keys will allow order sync but not shipment confirmation.",
            "For stores with multiple price lists or multilingual settings, test with a single order first to confirm SKUs and prices map correctly.",
        ],
    },
    {
        slug: "woocommerce",
        name: "WooCommerce",
        logo: "/woocommerce.svg",
        category: "Your Own Store",
        highlight: "REST API",
        overview: "WooCommerce connects to Pythias via Consumer Key and Consumer Secret generated in the WordPress admin. Pythias polls for new orders and pushes tracking confirmation back to WooCommerce — marking orders as Completed and triggering WooCommerce's customer notification email.",
        prerequisites: [
            "WordPress site with WooCommerce plugin installed and active",
            "WooCommerce version 3.5 or higher (REST API v3 required)",
            "WordPress admin access",
            "Your store URL must be publicly accessible (not localhost)",
        ],
        steps: [
            {
                title: "Create WooCommerce REST API keys",
                content: "In WordPress admin, go to <strong>WooCommerce → Settings → Advanced → REST API</strong>. Click <strong>Add key</strong>. Fill in: <em>Description</em>: \"Pythias Integration\", <em>User</em>: select an admin user, <em>Permissions</em>: <strong>Read/Write</strong>. Click <strong>Generate API key</strong>.",
            },
            {
                title: "Copy Consumer Key and Consumer Secret",
                content: "WooCommerce will display your <strong>Consumer Key</strong> and <strong>Consumer Secret</strong>. These are only shown once — copy both immediately. If you navigate away without copying, you will need to revoke and regenerate a new key pair.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → WooCommerce</strong>. Enter: your <strong>Store URL</strong> (e.g., <code>https://yourstore.com</code>), your <strong>Consumer Key</strong>, and your <strong>Consumer Secret</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Set permalink structure (important)",
                content: "WooCommerce REST API requires pretty permalinks to be enabled. In WordPress admin, go to <strong>Settings → Permalinks</strong>. Make sure it is set to anything other than <em>Plain</em> (e.g., <strong>Post name</strong>). Click <strong>Save Changes</strong> even if you do not change anything — this flushes the rewrite rules.",
            },
        ],
        whatSyncs: [
            "New WooCommerce orders in Processing status (pulled every 5 minutes)",
            "Order line items, product IDs, variation IDs, quantities, and shipping address",
            "Shipment tracking number and carrier pushed to WooCommerce order notes",
            "Order status updated to Completed in WooCommerce",
        ],
        tips: [
            "If you get a 401 authentication error, verify that pretty permalinks are enabled and that the Consumer Key/Secret belong to an admin user.",
            "WooCommerce's REST API endpoint is at <code>/wp-json/wc/v3/</code> — Pythias constructs this automatically from your store URL.",
            "For high-traffic stores, consider using WooCommerce webhooks mode (available via Pythias support) for near-instant order sync instead of polling.",
            "Variable products: Pythias maps to the <em>variation ID</em> and <em>variation SKU</em> — make sure each WooCommerce variation has a unique SKU assigned.",
        ],
    },
    {
        slug: "squarespace",
        name: "Squarespace",
        logo: "/squarespace.svg",
        category: "Your Own Store",
        highlight: "Commerce API",
        overview: "Squarespace Commerce stores connect to Pythias via a Developer API Key generated in your Squarespace account settings. Pythias pulls pending orders, routes them to production, and marks orders as fulfilled on Squarespace once shipped.",
        prerequisites: [
            "Squarespace store on a Commerce Basic or Advanced plan (Business plan does not include API access)",
            "Squarespace account with Administrator access",
        ],
        steps: [
            {
                title: "Generate a Squarespace Developer API Key",
                content: "Log into your Squarespace account and go to your site's settings. Navigate to <strong>Settings → Developer API Keys</strong>. Click <strong>Generate Key</strong>. Give it a name like \"Pythias Integration\". Under <em>Permissions</em>, enable: <strong>Orders</strong> → Read/Write. Click <strong>Generate Key</strong>.",
            },
            {
                title: "Copy the API Key",
                content: "After generation, Squarespace displays the API key once. Copy it immediately and store it securely. If lost, you must generate a new key.",
            },
            {
                title: "Enter the API key in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Squarespace</strong>. Paste your <strong>API Key</strong> into the field. Click <strong>Test Connection</strong>. Once verified, click <strong>Save</strong>.",
            },
            {
                title: "Configure fulfillment settings",
                content: "Choose how Pythias updates Squarespace orders after shipping. The default is to set the fulfillment status to <strong>Fulfilled</strong> and include the tracking number. Squarespace will automatically send the customer their shipping notification email.",
            },
        ],
        whatSyncs: [
            "New Squarespace orders in Pending status (pulled every 5 minutes)",
            "Order line items, product IDs, variant IDs, quantities, and shipping address",
            "Fulfillment status (order marked as Fulfilled in Squarespace)",
            "Tracking number added to the Squarespace order",
        ],
        tips: [
            "Squarespace API keys are tied to your account — if you transfer site ownership, you may need to regenerate the key under the new owner account.",
            "The Developer API Keys feature is only available on Commerce plans. If you see a plan upgrade prompt, your current plan does not include API access.",
            "Squarespace product IDs and variant IDs in the API response may differ from what you see in the admin — Pythias maps these automatically during the initial connection test.",
        ],
    },
    {
        slug: "mirakl",
        name: "Mirakl",
        logo: "/mirakl.png",
        logoBg: "#03182f",
        category: "Multi-Marketplace Platforms",
        highlight: "50+ Markets",
        overview: "Mirakl is a marketplace platform that powers Zalando, Otto, Allegro, Macy's, Nordstrom, Best Buy, Bloomingdale's, Carrefour, Bunnings, and 50+ other retailers globally. One Mirakl API connection in Pythias unlocks all Mirakl-powered channels simultaneously. Orders from all Mirakl channels appear in the same production queue.",
        prerequisites: [
            "Approved Mirakl seller account on at least one Mirakl-powered marketplace",
            "Mirakl API key from the Mirakl Operator (provided by each marketplace operator separately)",
            "Mirakl instance URL (unique to each marketplace operator, e.g., Zalando, Macy's etc.)",
        ],
        steps: [
            {
                title: "Obtain your Mirakl API key",
                content: "Each Mirakl-powered marketplace has its own operator portal. Log into the seller portal for your marketplace (e.g., Zalando Seller Program, Macy's Marketplace Portal). Navigate to <strong>Account Settings → API → API Keys</strong> (exact path varies by operator). Generate or copy your API key.",
            },
            {
                title: "Find your Mirakl instance URL",
                content: "Your Mirakl instance URL is specific to each marketplace operator. It typically looks like: <code>https://marketplace.operator-name.com/api</code>. This URL is provided in your seller onboarding documentation. If you are unsure, contact the marketplace operator's seller support.",
            },
            {
                title: "Add a Mirakl connection in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Mirakl</strong>. Enter: <strong>Instance URL</strong> (your marketplace's Mirakl API endpoint) and <strong>API Key</strong>. Give this connection a label (e.g., \"Zalando Mirakl\"). Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Add additional Mirakl channels",
                content: "If you sell on multiple Mirakl-powered marketplaces (e.g., both Zalando and Macy's), each has its own separate Mirakl API key and instance URL. Repeat Step 3 for each marketplace, creating a new connection entry for each. All connections will feed into the same Pythias order queue with the marketplace name clearly labeled.",
            },
            {
                title: "Map Mirakl shop SKUs",
                content: "Mirakl uses the operator's own product ID system (EAN, MPN, or operator-specific codes). In <strong>Admin → Edit Data → SKU Routing</strong>, map each Mirakl product code to your Pythias product SKU so production routing works correctly.",
            },
        ],
        whatSyncs: [
            "New orders from all connected Mirakl-powered channels (polled every 10 minutes per channel)",
            "Order line items, Mirakl offer SKUs, quantities, and buyer shipping address",
            "Order acceptance confirmation",
            "Shipment tracking confirmation pushed to each Mirakl channel",
            "Order fulfillment status update",
        ],
        tips: [
            "Each Mirakl-powered marketplace has its own seller standing and compliance metrics — monitor each channel's performance dashboard separately.",
            "Mirakl API keys are usually long-lived, but some operators rotate them periodically. If orders stop pulling for a specific channel, verify the API key in that marketplace's portal.",
            "Use the Pythias order label field to distinguish which Mirakl channel each order came from (e.g., \"Zalando\", \"Macy's\").",
            "Some Mirakl operators require specific shipping carrier codes — check with each operator's seller documentation for their accepted carrier list.",
        ],
    },
    {
        slug: "acenda",
        name: "Acenda",
        logo: "/acenda.png",
        category: "Multi-Marketplace Platforms",
        highlight: "150+ Channels",
        overview: "Acenda is a multi-channel commerce platform giving access to Kohl's, Target Plus, Macy's, Nordstrom, Bloomingdale's, Wayfair, Home Depot, Lowe's, Best Buy, Costco, Dick's Sporting Goods, and 150+ more retailers. One Acenda API connection in Pythias routes orders from all connected Acenda channels into a single production queue.",
        prerequisites: [
            "Active Acenda account with at least one connected retailer channel",
            "Acenda API credentials: Store ID (or Account ID) and API Key from your Acenda account settings",
        ],
        steps: [
            {
                title: "Log into your Acenda account",
                content: "Go to <strong>app.acenda.com</strong> and sign in. Navigate to <strong>Settings → API Access</strong> (or contact your Acenda account manager if you do not see an API section — API access may need to be enabled for your account tier).",
            },
            {
                title: "Generate or copy your API credentials",
                content: "In the API Access section, copy your <strong>Store ID</strong> and <strong>API Key</strong>. If generating a new key, provide a description like \"Pythias Fulfillment\" and select <em>Read/Write</em> permissions for Orders.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Acenda</strong>. Enter your <strong>Store ID</strong> and <strong>API Key</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Verify channel routing",
                content: "After connecting, review the order sources shown in Pythias. Each Acenda-connected retailer appears as the channel source on incoming orders (e.g., \"Kohl's via Acenda\", \"Wayfair via Acenda\"). Set up SKU routing rules in <strong>Admin → Edit Data</strong> to route each retailer's product codes to the correct production type.",
            },
        ],
        whatSyncs: [
            "Purchase orders from all Acenda-connected retailers (polled every 10 minutes)",
            "Order items, retailer-specific product IDs, quantities, and shipping address",
            "Order acknowledgment and acceptance",
            "Shipment confirmation with carrier, tracking, and ship date",
        ],
        tips: [
            "Acenda's retailer channels each have their own compliance requirements (acknowledgment windows, carrier requirements). Review each retailer's Acenda-provided vendor guide.",
            "Kohl's via Acenda requires EDI-style acknowledgment within 24 hours. Enable Auto-Acknowledge in the Pythias Acenda integration settings.",
            "Contact Pythias support before going live with Acenda to review your retailer-specific carrier code mappings.",
        ],
    },
    {
        slug: "rithum",
        name: "Rithum",
        logo: "/rithum.svg",
        category: "Multi-Marketplace Platforms",
        highlight: "Dropship Platform",
        overview: "Rithum (formerly ChannelAdvisor / DSCO) is a dropship and marketplace integration platform. A single Rithum connection unlocks Zulily and other Rithum-powered dropship retailers. Pythias connects via Rithum's API to receive purchase orders and confirm shipments.",
        prerequisites: [
            "Active Rithum (formerly DSCO/ChannelAdvisor) account",
            "API credentials from your Rithum account: Account ID and API Key/Token",
        ],
        steps: [
            {
                title: "Retrieve your Rithum API credentials",
                content: "Log into <strong>app.rithum.com</strong> (or the legacy dsco.io portal if applicable). Navigate to <strong>Settings → API Access → Credentials</strong>. Copy your <strong>Account ID</strong> and <strong>API Key</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Rithum</strong>. Enter your <strong>Account ID</strong> and <strong>API Key</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure retailer-specific settings",
                content: "Each Rithum-connected retailer (e.g., Zulily) may have specific acknowledgment requirements and carrier codes. In the Pythias Rithum integration settings, review the retailer-specific configuration options and update carrier mappings as needed.",
            },
        ],
        whatSyncs: [
            "Purchase orders from Rithum-connected retailers",
            "Order items, retailer SKUs, quantities, and shipping destination",
            "Order acknowledgment",
            "Shipment tracking and carrier confirmation",
        ],
        tips: [
            "Rithum was formerly known as DSCO (for dropship) and ChannelAdvisor (for marketplace). Your account credentials may use legacy branding.",
            "If you were previously integrated via DSCO, your API credentials should still work with the Rithum endpoint — contact Pythias support to confirm the endpoint configuration.",
        ],
    },
    {
        slug: "noon",
        name: "Noon",
        logo: "/noon.svg",
        category: "International Marketplaces",
        highlight: "UAE · SA · EG",
        overview: "Noon is the leading e-commerce marketplace in the UAE, Saudi Arabia, and Egypt. Pythias connects via the Noon Seller Lab API to pull purchase orders and confirm shipments. Noon uses strict fulfillment windows and requires shipment confirmation with a supported carrier.",
        prerequisites: [
            "Active Noon seller account (noon.partners)",
            "Noon Seller Lab API credentials: Access Key ID and Access Key Secret",
        ],
        steps: [
            {
                title: "Generate Noon API credentials",
                content: "Log into <strong>noon.partners</strong> (Noon Seller Lab). Go to <strong>Settings → API Access → Generate API Key</strong>. Copy your <strong>Access Key ID</strong> and <strong>Access Key Secret</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Noon</strong>. Enter your <strong>Access Key ID</strong>, <strong>Access Key Secret</strong>, and select your <strong>Noon region</strong> (UAE, Saudi Arabia, or Egypt). Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure shipping and fulfillment",
                content: "Noon supports specific carriers for each country. In the integration settings, select the default carrier for each Noon region you sell in. Noon's fulfillment window is typically 24–48 hours from order placement.",
            },
        ],
        whatSyncs: [
            "New purchase orders (polled every 10 minutes)",
            "Order items, Noon SKUs, quantities, and buyer shipping address",
            "Shipment confirmation with carrier and tracking",
            "Order fulfillment status",
        ],
        tips: [
            "Noon operates in multiple currencies (AED, SAR, EGP) — confirm your product pricing is correctly set for each country.",
            "Noon has strict seller performance metrics. Late shipments impact your seller score significantly.",
            "If you sell across multiple Noon countries, you can add each as a separate region under the same integration connection.",
        ],
    },
    {
        slug: "bol",
        name: "bol.com",
        logo: "/bol.svg",
        category: "International Marketplaces",
        highlight: "NL · BE",
        overview: "bol.com is the dominant e-commerce marketplace in the Netherlands and Belgium, with over 12 million active customers. Pythias connects via bol.com's OAuth2 API to pull open orders, ship them with integrated PostNL, DPD, or DHL label generation, and confirm fulfillment automatically.",
        prerequisites: [
            "Active bol.com retailer account (retailer.bol.com)",
            "bol.com API credentials: Client ID and Client Secret (generated in bol.com retailer settings)",
        ],
        steps: [
            {
                title: "Generate bol.com API credentials",
                content: "Log into <strong>retailer.bol.com</strong>. Navigate to <strong>Account Settings → API → Create API Access</strong>. Enter a name (\"Pythias Integration\") and select <em>Read/Write</em> permissions for Orders and Shipments. Click <strong>Save</strong>. Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → bol.com</strong>. Enter your <strong>Client ID</strong> and <strong>Client Secret</strong>. Click <strong>Test Connection</strong>. If the test passes, click <strong>Save</strong>.",
            },
            {
                title: "Configure carrier settings",
                content: "bol.com supports PostNL, DPD, DHL, and several other Dutch/Belgian carriers. In the integration settings, select your preferred carrier for bol.com orders. If you use PostNL via bol.com's shipping service, Pythias can request labels directly through the bol.com Shipping API.",
            },
        ],
        whatSyncs: [
            "Open orders (polled every 10 minutes)",
            "Order items, EAN codes, quantities, and buyer shipping address",
            "Shipment confirmation with transporter code (carrier) and tracking number",
            "Order fulfillment status update",
        ],
        tips: [
            "bol.com's SLA requires shipment confirmation within the handling time you specified for each listing. Set urgency flags in Pythias for orders approaching the deadline.",
            "bol.com uses EAN codes to identify products. Map EANs to your Pythias product SKUs in Admin → Edit Data.",
            "bol.com API credentials do not expire but can be revoked. If orders stop pulling, verify credentials in retailer.bol.com settings.",
        ],
    },
    {
        slug: "rakuten",
        name: "Rakuten",
        logo: "/rakuten.svg",
        category: "International Marketplaces",
        highlight: "Seller API",
        overview: "Rakuten is Japan's leading e-commerce platform with over 100 million registered members worldwide. Pythias connects via Rakuten's Marketplace Seller API to pull orders and confirm shipments. Rakuten uses a unique RMS (Rakuten Merchant Server) credential system.",
        prerequisites: [
            "Active Rakuten Ichiba seller account (rakuten.co.jp or global)",
            "Rakuten RMS access with API enabled (contact your Rakuten account manager)",
            "Rakuten Service Secret and License Key",
        ],
        steps: [
            {
                title: "Enable API access in Rakuten RMS",
                content: "Log into <strong>rms.rakuten.co.jp</strong>. Navigate to <strong>Store Settings → External System Integration → API Settings</strong>. Enable API access for your store. If you do not see this option, contact your Rakuten account manager to have API access activated for your account.",
            },
            {
                title: "Obtain your Service Secret and License Key",
                content: "In the API Settings section, copy your <strong>Service Secret</strong> and <strong>License Key</strong>. These are your authentication credentials for Rakuten's API.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → Rakuten</strong>. Enter your <strong>Service Secret</strong> and <strong>License Key</strong>. Click <strong>Test Connection</strong> and then <strong>Save</strong>.",
            },
            {
                title: "Configure shipping settings",
                content: "Rakuten orders are shipped within Japan using Japanese carriers (Yamato Transport, Sagawa, Japan Post). In the integration settings, configure your default carrier and confirm that the carrier codes used by Pythias match Rakuten's accepted carrier list.",
            },
        ],
        whatSyncs: [
            "New orders (polled every 10 minutes)",
            "Order items, Rakuten item IDs, quantities, and buyer shipping address",
            "Shipment confirmation with carrier code and tracking number",
            "Order status update",
        ],
        tips: [
            "Rakuten's API documentation is primarily in Japanese. Pythias support can assist with carrier code mappings for Japanese carriers.",
            "Rakuten Ichiba (Japan) and Rakuten Global Market (international) are separate platforms with different API endpoints — confirm which platform your account uses.",
        ],
    },
    {
        slug: "onbuy",
        name: "OnBuy",
        logo: "/onbuy.svg",
        category: "International Marketplaces",
        highlight: "UK Market",
        overview: "OnBuy is the UK's fastest-growing marketplace and a strong Amazon alternative for British shoppers, processing billions in GMV annually. Pythias connects via OnBuy's Seller API using an API key to pull orders and push shipment confirmation.",
        prerequisites: [
            "Active OnBuy seller account (onbuy.com/sell)",
            "OnBuy API key generated in your seller dashboard",
        ],
        steps: [
            {
                title: "Generate your OnBuy API Key",
                content: "Log into your <strong>OnBuy Seller Dashboard</strong>. Navigate to <strong>Settings → API → Generate API Key</strong>. Give the key a name (\"Pythias Integration\") and select <em>Orders: Read/Write</em> permission. Click <strong>Generate</strong>. Copy the API key.",
            },
            {
                title: "Enter credentials in Pythias",
                content: "In Pythias, go to <strong>Admin → Integrations → Add New Integration → OnBuy</strong>. Enter your <strong>API Key</strong>. Click <strong>Test Connection</strong>. If successful, click <strong>Save</strong>.",
            },
            {
                title: "Configure shipping settings",
                content: "OnBuy requires sellers to use tracked shipping services. In the integration settings, configure your default carrier for UK orders (Royal Mail, DPD UK, Hermes, DHL UK). Pythias will include the carrier name and tracking number in the shipment confirmation.",
            },
        ],
        whatSyncs: [
            "New orders (polled every 10 minutes)",
            "Order items, OnBuy product IDs, quantities, and buyer shipping address",
            "Shipment tracking confirmation pushed to OnBuy",
            "Order fulfillment status update",
        ],
        tips: [
            "OnBuy charges a commission fee per sale. Ensure your pricing accounts for this before listing.",
            "OnBuy's API uses GBP for all pricing — confirm your pricing is in the correct currency.",
            "If your API key is rotated, update it in Pythias immediately to avoid order sync interruption.",
        ],
    },
];

export const INTEGRATION_MAP = Object.fromEntries(INTEGRATIONS.map(i => [i.slug, i]));

export const CATEGORIES_ORDER = [
    "Major Marketplaces",
    "Your Own Store",
    "Boutique & Handmade",
    "Social Commerce",
    "Multi-Marketplace Platforms",
    "International Marketplaces",
];
