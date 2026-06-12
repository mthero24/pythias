"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box, Container, Typography, LinearProgress, Paper, Stack,
    Chip, Button, Collapse, IconButton, Divider, Alert,
} from "@mui/material";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ExpandMoreIcon     from "@mui/icons-material/ExpandMore";
import ExpandLessIcon     from "@mui/icons-material/ExpandLess";
import OpenInNewIcon      from "@mui/icons-material/OpenInNew";
import axios from "axios";

const STEPS_FULFILLMENT = [
    {
        key: "dataCategories",
        title: "Add data categories",
        description: "Set up your print types (DTF, Embroidery, Sublimation…), print locations (Front, Back, Sleeve…), and departments (Men, Women, Kids…). These are the building blocks everything else depends on.",
        action: { label: "Edit data categories", path: "admin/edit-data" },
        manual: false,
    },
    {
        key: "colors",
        title: "Add colors",
        description: "Create the color options available for your blanks. Include names, hex codes, and SKU codes. Colors are shared across all blanks so set up the full palette once.",
        action: { label: "Manage colors", path: "admin/colors" },
        manual: false,
    },
    {
        key: "firstBlank",
        title: "Create your first blank",
        description: "A blank is a physical garment or product (e.g. Gildan 64000 T-Shirt). Create at least one blank including its sizes, colors, print locations, mockup images, and box configuration.",
        action: { label: "Create a blank", path: "admin/blanks/create" },
        manual: false,
    },
    {
        key: "firstDesign",
        title: "Create your first design",
        description: "A design is the artwork that gets printed onto a blank. Upload your design files, assign print type and locations, and link to the blanks it's available on.",
        action: { label: "Create a design", path: "admin/designs" },
        manual: false,
    },
    {
        key: "firstProduct",
        title: "Create your first product",
        description: "A product combines a blank + design into a sellable SKU with pricing, images, and marketplace-ready details. Once created it can be pushed to any connected marketplace.",
        action: { label: "Create a product", path: "admin/products" },
        manual: false,
    },
    {
        key: "firstIntegration",
        title: "Connect your first integration",
        description: "Go to Integrations and add your marketplace API credentials (Amazon, Walmart, TikTok Shop, Etsy, eBay, Shopify, and more). This authorizes Pythias to push listings and receive orders on your behalf.",
        action: { label: "Manage integrations", path: "admin/integrations" },
        manual: false,
    },
    {
        key: "marketplace",
        title: "Create a marketplace and configure variables",
        description: "From the product card, open the marketplace modal to create a marketplace and attach your integration connection. Product-level variables are added through the marketplace modal on the product page. Blank-specific variables are added through the marketplace modal on the blanks page.",
        action: { label: "Go to products", path: "admin/products" },
        manual: false,
    },
    {
        key: "firstListing",
        title: "Send your first listing",
        description: "From the product page, open the marketplace modal and click Send Listing. Make sure all required product and blank variables are filled in first — the modal will highlight any that are missing before sending.",
        action: { label: "Go to products", path: "admin/products" },
        manual: false,
    },
    {
        key: "shippingHardware",
        title: "Set up shipping and hardware",
        description: "Configure your shipping carriers, label printers (Zebra, Dymo, etc.), and any scales or scanners. Shipping settings control how labels are generated and what rates are quoted.",
        action: { label: "Shipping settings", path: "admin/settings" },
        manual: true,
        manualNote: "Complete this step in your settings, then mark it done here.",
    },
    {
        key: "internalServer",
        title: "Set up internal server",
        description: "Go to Shipping & Hardware settings and enter your local server IP address and API key. This connects your on-prem production floor to the platform for label printing, file routing, and status syncing.",
        action: { label: "Shipping & Hardware settings", path: "admin/settings/shipping" },
        manual: true,
        manualNote: "Add the local IP and key in Shipping & Hardware settings, then mark it done here.",
    },
    {
        key: "fileWriter",
        title: "Set up file writer",
        description: "Download and install the Pythias File Writer app on each computer in your production floor — DTF printers, shipping stations, fold machines, embroidery machines, and sublimation computers each need their own installation. On each machine, go to Settings and add the output folder and printer so files are routed to the right place.",
        action: { label: "Download file writer", path: "downloads" },
        manual: true,
        manualNote: "Install the file writer and add the output folder and printer in settings, then mark it done here.",
    },
];

// Commerce Cloud orgs don't run a production floor — they sell and route orders to
// fulfillment providers. Their onboarding is funding, channels, catalog, and a test order.
const STEPS_COMMERCE = [
    {
        key: "fundWallet",
        title: "Add funds to your wallet",
        description: "Commerce Cloud runs on a prepaid wallet. When an order comes in, Pythias charges your wallet the provider's wholesale cost and routes it for fulfillment. Add a payment method and a starting balance so your first orders can route.",
        action: { label: "Open wallet", path: "fulfillment/wallet" },
        manual: false,
    },
    {
        key: "autoRecharge",
        title: "Turn on auto-recharge",
        description: "So orders never fail to route for a low balance, set an auto-recharge amount and minimum threshold. When your balance drops below the floor, Pythias tops it up automatically from your saved payment method.",
        action: { label: "Set auto-recharge", path: "fulfillment/wallet" },
        manual: false,
    },
    {
        key: "salesChannel",
        title: "Connect a sales channel",
        description: "Connect where your orders come from — a marketplace (Amazon, Walmart, TikTok, Etsy, eBay, Shopify), or your own storefront via the Partner API. Orders from any connected channel flow into Pythias and route to a fulfillment provider automatically.",
        action: { label: "Manage integrations", path: "admin/integrations" },
        manual: false,
    },
    {
        key: "addProducts",
        title: "Add products to sell",
        description: "Build your catalog of sellable products. Each product maps to a blank (garment) and design so Pythias knows how to fulfill it. You can also send orders with the design artwork inline — but cataloged products list and route the most smoothly.",
        action: { label: "Add products", path: "admin/products" },
        manual: false,
    },
    {
        key: "testOrder",
        title: "Place a test order",
        description: "Send a test order through the pipeline to confirm it routes to a provider and reaches fulfillment. Watch it land in Routing Status with a selected provider and score breakdown.",
        action: { label: "Create an order", path: "admin/products" },
        manual: false,
    },
    {
        key: "reviewRouting",
        title: "Review routing & fulfillment",
        description: "See how orders are scored and assigned to providers, and where they are in fulfillment. The Commerce Cloud dashboard shows routing decisions, provider assignments, wholesale costs, and order status.",
        action: { label: "Open Commerce Cloud", path: "admin/commerce-cloud" },
        manual: true,
        manualNote: "Review the Commerce Cloud dashboard and routing status, then mark it done here.",
    },
];

function StepRow({ step, done, slug, open, onToggle, onMarkDone }) {
    return (
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ px: 3, py: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                onClick={onToggle}
            >
                {done
                    ? <CheckCircleIcon sx={{ color: "success.main", flexShrink: 0 }} />
                    : <RadioButtonUncheckedIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
                }
                <Typography fontWeight={done ? 500 : 700} sx={{ flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "text.secondary" : "text.primary" }}>
                    {step.title}
                </Typography>
                {done && <Chip label="Done" size="small" color="success" variant="outlined" />}
                <IconButton size="small">{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            </Stack>

            <Collapse in={open}>
                <Box sx={{ px: 3, pb: 3, ml: 5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                        {step.description}
                    </Typography>
                    {step.manualNote && !done && (
                        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>{step.manualNote}</Alert>
                    )}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            size="small"
                            endIcon={<OpenInNewIcon />}
                            href={`/${slug}/${step.action.path}`}
                            sx={{ borderRadius: 1.5 }}
                        >
                            {step.action.label}
                        </Button>
                        {step.manual && !done && (
                            <Button
                                variant="contained"
                                size="small"
                                color="success"
                                sx={{ borderRadius: 1.5 }}
                                onClick={() => onMarkDone(step.key)}
                            >
                                Mark as done
                            </Button>
                        )}
                        {step.manual && done && (
                            <Button
                                variant="text"
                                size="small"
                                color="inherit"
                                sx={{ borderRadius: 1.5, color: "text.disabled" }}
                                onClick={() => onMarkDone(step.key, false)}
                            >
                                Undo
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Collapse>
        </Box>
    );
}

export default function SetupGuideClient({ steps: initialSteps, completed: initialCompleted, total, slug, orgType }) {
    const router = useRouter();
    const STEPS = orgType === "commerce" ? STEPS_COMMERCE : STEPS_FULFILLMENT;
    const isCommerce = orgType === "commerce";
    const [steps, setSteps]         = useState(initialSteps);
    const [completed, setCompleted] = useState(initialCompleted);
    const [openKey, setOpenKey]     = useState(
        // Auto-open the first incomplete step
        STEPS.find(s => !initialSteps[s.key])?.key ?? null
    );

    const pct = Math.round((completed / total) * 100);
    const allDone = completed === total;

    const markDone = async (key, value = true) => {
        await axios.patch("/api/setup-guide", { step: key, value });
        setSteps(prev => ({ ...prev, [key]: value }));
        setCompleted(prev => value ? prev + 1 : prev - 1);
        // Auto-advance to next incomplete step
        if (value) {
            const nextIdx = STEPS.findIndex(s => s.key === key) + 1;
            const next = STEPS.slice(nextIdx).find(s => !steps[s.key] || s.key === key ? !value : false);
            if (next) setOpenKey(next.key);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>Setup Guide</Typography>
                    <Typography color="text.secondary">
                        {isCommerce
                            ? "Follow these steps to start selling and routing orders to fulfillment providers."
                            : "Follow these steps to get your Pythias platform fully configured."}
                    </Typography>
                </Box>
                {allDone && (
                    <Chip label="Setup complete 🎉" color="success" sx={{ fontWeight: 700, fontSize: "0.9rem", height: 36 }} />
                )}
            </Stack>

            {/* Progress */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>{completed} of {total} steps completed</Typography>
                    <Typography variant="body2" color="text.secondary">{pct}%</Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: allDone ? "success.main" : "#6366f1" } }}
                />
            </Paper>

            {/* Steps */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                {STEPS.map((step, i) => (
                    <StepRow
                        key={step.key}
                        step={step}
                        done={steps[step.key]}
                        slug={slug}
                        open={openKey === step.key}
                        onToggle={() => setOpenKey(prev => prev === step.key ? null : step.key)}
                        onMarkDone={markDone}
                    />
                ))}
            </Paper>

            {allDone && (
                <Alert severity="success" sx={{ mt: 3 }}>
                    <strong>You&apos;re all set!</strong> Your Pythias platform is fully configured.
                </Alert>
            )}
        </Container>
    );
}
