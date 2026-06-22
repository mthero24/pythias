"use client";
import { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Avatar, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Image from "next/image";
import LogoImg from "../public/fullfilment_cloud_transparant.png";
import CommerceLogoImg from "../public/commerce-cloud-logo.png";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useOrg } from "./OrgProvider";
import TierBadge from "./TierBadge";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LanguageIcon from "@mui/icons-material/Language";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import BrushIcon from "@mui/icons-material/Brush";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FolderIcon from "@mui/icons-material/Folder";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ViewListIcon from "@mui/icons-material/ViewList";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import SettingsIcon from "@mui/icons-material/Settings";
import PaymentIcon from "@mui/icons-material/Payment";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import LabelIcon from "@mui/icons-material/Label";
import PaletteIcon from "@mui/icons-material/Palette";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import DownloadIcon from "@mui/icons-material/Download";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CampaignIcon from "@mui/icons-material/Campaign";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ScienceIcon from "@mui/icons-material/Science";
import RateReviewIcon from "@mui/icons-material/RateReview";
import PaidIcon from "@mui/icons-material/Paid";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import HistoryIcon from "@mui/icons-material/History";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import TuneIcon from "@mui/icons-material/Tune";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BugReportIcon from "@mui/icons-material/BugReport";
import SellIcon from "@mui/icons-material/Sell";
import HubIcon from "@mui/icons-material/Hub";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ShieldIcon from "@mui/icons-material/Shield";
import PodcastsIcon from "@mui/icons-material/Podcasts";

const DRAWER_WIDTH = 268;
const SIDEBAR_BG = "#1a1f2e";
const SIDEBAR_ACTIVE_BG = "rgba(255,255,255,0.10)";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.06)";
const SIDEBAR_TEXT = "rgba(255,255,255,0.82)";
const SIDEBAR_TEXT_DIM = "rgba(255,255,255,0.38)";
const SIDEBAR_ICON = "rgba(255,255,255,0.60)";
const SIDEBAR_ACTIVE_ICON = "#fff";
const SIDEBAR_ACTIVE_TEXT = "#fff";
const SIDEBAR_ACCENT = "#6366f1";

// Storefront add-on menu items (shared) — flagged `storefront` so the gate below can collapse them
// to a single "Learn about Storefront" link until the org subscribes.
const STOREFRONT_ITEMS = [
    { label: "Storefront",       path: "storefront",             icon: <LanguageIcon fontSize="small" />,      storefront: true },
    { label: "Stores",           path: "stores",                 icon: <StorefrontIcon fontSize="small" />,    storefront: true },
    { label: "Autopilot",        path: "autopilot",              icon: <AutoFixHighIcon fontSize="small" />,   storefront: true },
    { label: "Collections",      path: "collections",            icon: <CategoryIcon fontSize="small" />,      storefront: true },
    { label: "Discounts",        path: "discounts",              icon: <LocalOfferIcon fontSize="small" />,    storefront: true },
    { label: "Returns",          path: "returns",                icon: <AssignmentReturnIcon fontSize="small" />, storefront: true },
    { label: "Subscriptions",    path: "subscriptions",          icon: <AutorenewIcon fontSize="small" />,     storefront: true },
    { label: "A/B Testing",      path: "experiments",            icon: <ScienceIcon fontSize="small" />,       storefront: true },
    { label: "Reviews",          path: "reviews",                icon: <RateReviewIcon fontSize="small" />,    storefront: true },
    { label: "Network Protection", path: "network",              icon: <ShieldIcon fontSize="small" />,        storefront: true },
    { label: "Merchant of Record", path: "mor",                  icon: <GavelIcon fontSize="small" />,         storefront: true },
    { label: "Marketing",        path: "marketing",              icon: <CampaignIcon fontSize="small" />,      storefront: true },
    { label: "Automations",      path: "automations",            icon: <AltRouteIcon fontSize="small" />,      storefront: true },
    { label: "Sales Channels",   path: "channels",               icon: <PodcastsIcon fontSize="small" />,      storefront: true },
    { label: "Site Analytics",   path: "analytics",              icon: <QueryStatsIcon fontSize="small" />,    storefront: true },
    { label: "Profit",           path: "profit",                 icon: <PaidIcon fontSize="small" />,          storefront: true },
    { label: "Demand",           path: "demand",                 icon: <TrendingUpIcon fontSize="small" />,    storefront: true },
    { label: "SEO Pages",        path: "seo-pages",              icon: <MenuBookIcon fontSize="small" />,      storefront: true },
    { label: "International",     path: "international",           icon: <LanguageIcon fontSize="small" />,      storefront: true },
];

function buildSections(base, org) {
    let sections = org?.orgType === "commerce"
        ? buildCommerceSections(base)
        : org?.orgType === "storefront"
            ? buildStorefrontSections(base)
            : buildFulfillmentSections(base);

    // Storefront is offered to every org. Commerce orgs embed the items in Catalog; for other org
    // types, add a dedicated Storefront section so the gate (below) can surface it / its learn link.
    if (!sections.some(s => s.items.some(i => i.storefront))) {
        sections = [...sections];
        sections.splice(Math.min(1, sections.length), 0, { label: "Storefront", items: [...STOREFRONT_ITEMS] });
    }

    // Fulfillment Network ("earn as a fulfiller") — its OWN section, separate from the storefront
    // product. Hidden for Commerce Cloud orgs (they OUTSOURCE fulfillment — they don't ship their own
    // orders, so they can't build the shipping track record the program requires). Shown to fulfillment
    // orgs; the info page is open and enrollment is gated in-page by tenure + shipping-speed eligibility.
    if (org?.orgType !== "commerce" && org?.orgType !== "storefront") {
        sections = [...sections];
        const fulfillerSection = { label: "Fulfillment Network", items: [
            { label: "Earn as Fulfiller", path: "supplier", icon: <HandshakeIcon fontSize="small" /> },
        ] };
        const helpIdx = sections.findIndex(s => s.label === "Help");
        if (helpIdx >= 0) sections.splice(helpIdx, 0, fulfillerSection); else sections.push(fulfillerSection);
    }

    // Gate the storefront product: if this org hasn't subscribed, hide every storefront-only
    // item and surface a single "Learn about Storefront" link (→ welcome/signup page).
    // Storefront-only orgs (orgType "storefront") ARE the storefront product — never gate them.
    if (!org?.storefrontEnabled && org?.orgType !== "storefront") {
        sections = sections.map(section => {
            if (!section.items.some(i => i.storefront)) return section;
            const idx = section.items.findIndex(i => i.storefront);
            const items = section.items.filter(i => !i.storefront);
            items.splice(Math.min(idx, items.length), 0, {
                label: "Learn about Storefront", path: "storefront/welcome",
                icon: <StorefrontIcon fontSize="small" />, learn: true,
            });
            return { ...section, items };
        });
    }

    return sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
            ...item,
            href: item.href ?? `${base}/${item.path}`,
        })),
    }));
}

function buildFulfillmentSections(base) {
    return [
        {
            label: "Overview",
            items: [
                { label: "Dashboard", path: "dashboard", icon: <DashboardIcon fontSize="small" />, exact: true },
            ],
        },
        {
            label: "Catalog",
            items: [
                { label: "Blanks",           path: "admin/blanks",           icon: <CheckroomIcon fontSize="small" /> },
                { label: "Colors",           path: "admin/colors",           icon: <PaletteIcon fontSize="small" /> },
                { label: "Designs",          path: "admin/designs",          icon: <BrushIcon fontSize="small" /> },
                { label: "Design Templates", path: "admin/design-templates", icon: <DesignServicesIcon fontSize="small" /> },
                { label: "Products",         path: "products",               icon: <InventoryIcon fontSize="small" /> },
                { label: "Converters",       path: "admin/converters",       icon: <CompareArrowsIcon fontSize="small" /> },
                { label: "Downloads",        path: "admin/downloads",        icon: <DownloadIcon fontSize="small" /> },
                { label: "Brands",           path: "admin/brands",           icon: <SellIcon fontSize="small" /> },
                { label: "Edit Data",        path: "admin/edit-data",        icon: <TuneIcon fontSize="small" /> },
            ],
        },
        {
            label: "Orders",
            items: [
                { label: "Orders",            path: "orders",            icon: <ShoppingCartIcon fontSize="small" /> },
                { label: "Marketplaces",      path: "marketplaces",      icon: <StorefrontIcon fontSize="small" /> },
                { label: "Inventory",         path: "inventory",         icon: <WarehouseIcon fontSize="small" /> },
                { label: "Product Inventory", path: "inventory/product", icon: <InventoryIcon fontSize="small" /> },
            ],
        },
        {
            label: "Production",
            items: [
                { label: "Print Labels",  path: "production/print-labels",    icon: <PrintIcon fontSize="small" /> },
                { label: "Bulk Orders",   path: "production/bulk",            icon: <ViewListIcon fontSize="small" /> },
                { label: "Load DTF",      path: "production/dtf-send",        icon: <FileUploadIcon fontSize="small" /> },
                { label: "Find DTF",      path: "production/dtf-find",        icon: <FindInPageIcon fontSize="small" /> },
                { label: "GTX",           path: "production/gtx",             icon: <LocalPrintshopIcon fontSize="small" /> },
                { label: "Embroidery",    path: "production/embroidery",      icon: <AutoFixHighIcon fontSize="small" /> },
                { label: "Sublimation",   path: "production/sublimation",     icon: <PhotoCameraIcon fontSize="small" /> },
                { label: "Folder",        path: "production/roq-folder",      icon: <FolderIcon fontSize="small" /> },
                { label: "Ship Orders",   path: "production/shipping",        icon: <LocalShippingIcon fontSize="small" /> },
                { label: "Ship Labels",   path: "production/shipping-labels", icon: <LabelIcon fontSize="small" /> },
                { label: "Returns",       path: "production/returns",         icon: <AssignmentReturnIcon fontSize="small" /> },
            ],
        },
        {
            label: "Account",
            items: [
                { label: "Reports",             path: "reports",             icon: <BarChartIcon fontSize="small" /> },
                { label: "Analytics",           path: "admin/analytics",     icon: <TimelineIcon fontSize="small" /> },
                { label: "Activity",            path: "admin/activity",      icon: <HistoryIcon fontSize="small" /> },
                { label: "Sales",               path: "admin/sales",         icon: <TrendingUpIcon fontSize="small" /> },
                { label: "Integrations",        path: "integrations",        icon: <IntegrationInstructionsIcon fontSize="small" /> },
                { label: "Track Labels",        path: "admin/track-labels",  icon: <TrackChangesIcon fontSize="small" /> },
                { label: "Error Logs",          path: "errors",              icon: <BugReportIcon fontSize="small" /> },
                { label: "Licenses",            path: "admin/license",       icon: <GavelIcon fontSize="small" /> },
                { label: "Users",               path: "users",               icon: <PeopleIcon fontSize="small" /> },
                { label: "My Account",          path: "account",             icon: <AccountCircleIcon fontSize="small" /> },
                { label: "Settings",            path: "settings",            icon: <SettingsIcon fontSize="small" /> },
                { label: "Shipping & Hardware", path: "settings/shipping",   icon: <LocalShippingIcon fontSize="small" /> },
                { label: "Label Creator",       path: "settings/labels",     icon: <LabelIcon fontSize="small" /> },
                { label: "Picklist Settings",   path: "settings/picklist",   icon: <SettingsIcon fontSize="small" /> },
                { label: "Commerce Cloud",      path: "admin/commerce-cloud", icon: <HubIcon fontSize="small" /> },
                { label: "Billing",             path: "billing",             icon: <PaymentIcon fontSize="small" /> },
                { label: "Support",             path: "support",             icon: <SupportAgentIcon fontSize="small" /> },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Guides",       path: "guides",     icon: <MenuBookIcon fontSize="small" /> },
                { label: "Setup Guides", href: "https://pythiastechnologies.com/setup-guides/integrations", icon: <IntegrationInstructionsIcon fontSize="small" />, target: "_blank" },
            ],
        },
    ];
}

function buildCommerceSections(base) {
    return [
        {
            label: "Overview",
            items: [
                { label: "Dashboard", path: "dashboard", icon: <DashboardIcon fontSize="small" />, exact: true },
            ],
        },
        {
            label: "Catalog",
            items: [
                { label: "Garment Catalog",  path: "catalog",                icon: <CheckroomIcon fontSize="small" /> },
                ...STOREFRONT_ITEMS,
                { label: "Designs",          path: "admin/designs",          icon: <BrushIcon fontSize="small" /> },
                { label: "Design Templates", path: "admin/design-templates", icon: <DesignServicesIcon fontSize="small" /> },
                { label: "Products",         path: "products",               icon: <InventoryIcon fontSize="small" /> },
                { label: "Converters",       path: "admin/converters",       icon: <CompareArrowsIcon fontSize="small" /> },
                { label: "Downloads",        path: "admin/downloads",        icon: <DownloadIcon fontSize="small" /> },
                { label: "Brands",           path: "admin/brands",           icon: <SellIcon fontSize="small" /> },
                // Edit Data removed for Commerce Cloud — taxonomy & print settings are inherited
                // from Premier (seeded by the catalog sync). Print-type pricing is set on the Garment Catalog.
            ],
        },
        {
            label: "Orders",
            items: [
                { label: "Orders",            path: "orders",            icon: <ShoppingCartIcon fontSize="small" /> },
                { label: "Marketplaces",      path: "marketplaces",      icon: <StorefrontIcon fontSize="small" /> },
                { label: "Product Inventory", path: "inventory/product", icon: <InventoryIcon fontSize="small" /> },
            ],
        },
        {
            // Commerce Cloud customers don't run production themselves —
            // their orders are routed to fulfillment providers.
            label: "Fulfillment",
            items: [
                { label: "Provider Catalog",  path: "fulfillment/catalog",  icon: <HubIcon fontSize="small" /> },
                { label: "Routing Status",    path: "fulfillment/routing",  icon: <AltRouteIcon fontSize="small" /> },
                { label: "Wallet",            path: "fulfillment/wallet",   icon: <AccountBalanceWalletIcon fontSize="small" /> },
                { label: "Payouts",           path: "payouts",              icon: <PaymentIcon fontSize="small" /> },
            ],
        },
        {
            label: "Account",
            items: [
                { label: "Reports",      path: "reports",          icon: <BarChartIcon fontSize="small" /> },
                { label: "Analytics",    path: "admin/analytics",  icon: <TimelineIcon fontSize="small" /> },
                { label: "Activity",     path: "admin/activity",   icon: <HistoryIcon fontSize="small" /> },
                { label: "Sales",        path: "admin/sales",      icon: <TrendingUpIcon fontSize="small" /> },
                { label: "Integrations", path: "integrations",     icon: <IntegrationInstructionsIcon fontSize="small" /> },
                { label: "Licenses",     path: "admin/license",    icon: <GavelIcon fontSize="small" /> },
                { label: "Users",        path: "users",            icon: <PeopleIcon fontSize="small" /> },
                { label: "My Account",   path: "account",          icon: <AccountCircleIcon fontSize="small" /> },
                { label: "Settings",     path: "settings",         icon: <SettingsIcon fontSize="small" /> },
                { label: "Billing",      path: "billing",          icon: <PaymentIcon fontSize="small" /> },
                { label: "Support",      path: "support",          icon: <SupportAgentIcon fontSize="small" /> },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Guides",       path: "guides",     icon: <MenuBookIcon fontSize="small" /> },
                { label: "Setup Guides", href: "https://pythiastechnologies.com/setup-guides/integrations", icon: <IntegrationInstructionsIcon fontSize="small" />, target: "_blank" },
            ],
        },
    ];
}

// Storefront Cloud: a standalone-storefront org. Focused on the storefront product —
// no production floor (fulfillment) and no provider-routing (commerce); the seller
// self-fulfills / exports orders to their own systems.
function buildStorefrontSections(base) {
    return [
        { label: "Overview", items: [{ label: "Dashboard", path: "dashboard", icon: <DashboardIcon fontSize="small" />, exact: true }] },
        { label: "Storefront", items: [...STOREFRONT_ITEMS] },
        {
            label: "Catalog",
            items: [
                { label: "Products",         path: "products",               icon: <InventoryIcon fontSize="small" /> },
                { label: "Designs",          path: "admin/designs",          icon: <BrushIcon fontSize="small" /> },
                { label: "Design Templates", path: "admin/design-templates", icon: <DesignServicesIcon fontSize="small" /> },
                { label: "Brands",           path: "admin/brands",           icon: <SellIcon fontSize="small" /> },
            ],
        },
        {
            label: "Orders",
            items: [
                { label: "Orders",  path: "orders",  icon: <ShoppingCartIcon fontSize="small" /> },
                { label: "Payouts", path: "payouts", icon: <PaymentIcon fontSize="small" /> },
            ],
        },
        {
            label: "Account",
            items: [
                { label: "Reports",       path: "reports",       icon: <BarChartIcon fontSize="small" /> },
                { label: "Integrations",  path: "integrations",  icon: <IntegrationInstructionsIcon fontSize="small" /> },
                { label: "Users",         path: "users",         icon: <PeopleIcon fontSize="small" /> },
                { label: "Settings",      path: "settings",      icon: <SettingsIcon fontSize="small" /> },
                { label: "Billing",       path: "billing",       icon: <PaymentIcon fontSize="small" /> },
                { label: "Support",       path: "support",       icon: <SupportAgentIcon fontSize="small" /> },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Guides", path: "guides", icon: <MenuBookIcon fontSize="small" /> },
                { label: "Setup Guides", href: "https://pythiastechnologies.com/setup-guides/integrations", icon: <IntegrationInstructionsIcon fontSize="small" />, target: "_blank" },
            ],
        },
    ];
}

export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { data: session } = useSession();
    const { org } = useOrg() ?? {};
    const pathname = usePathname();
    const base = org?.slug ? `/${org.slug}` : "";

    const isCommerce = org?.orgType === "commerce";
    const isStorefront = org?.orgType === "storefront";
    // string path (not a static import) so the build doesn't fail before the asset is added
    const logo = isCommerce ? CommerceLogoImg : isStorefront ? "/storefront-logo.png" : LogoImg;

    const initials = session?.user
        ? ((session.user.firstName?.[0] ?? "") + (session.user.lastName?.[0] ?? "")).toUpperCase() || session.user.userName?.[0]?.toUpperCase() || "?"
        : "?";

    return (
        <>
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    backgroundColor: isCommerce ? "#2c2c3a" : isStorefront ? "#1c2333" : "#0f172a",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    color: "#fff",
                    mb: 2,
                }}
            >
                <Toolbar sx={{ minHeight: "56px !important", px: { xs: 1.5, sm: 2 } }}>
                    <Tooltip title="Open menu" placement="bottom">
                        <IconButton
                            size="medium"
                            edge="start"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ mr: 1.5, color: "rgba(255,255,255,0.8)" }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Tooltip>

                    <Link href={`${base}/dashboard`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                        <Image
                            src={logo}
                            alt="Pythias Technologies"
                            width={160}
                            height={74}
                            priority
                            style={{ height: "auto" }}
                        />
                    </Link>

                    <Box sx={{ flex: 1 }} />

                    {org && <TierBadge tier={org.tier} status={org.status} />}

                    <Tooltip title="Sign out">
                        <IconButton
                            size="small"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            sx={{
                                ml: 1,
                                color: "rgba(255,255,255,0.65)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 1.5,
                                px: 1.25,
                                py: 0.6,
                                gap: 0.75,
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.3)" },
                            }}
                        >
                            <LogoutIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Sign out</Typography>
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <NavDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                initials={initials}
                base={base}
                pathname={pathname}
                session={session}
                org={org}
            />
        </>
    );
}

function NavDrawer({ open, onClose, initials, base, pathname, session, org }) {
    const sections = buildSections(base, org);
    const isCommerce = org?.orgType === "commerce";
    const isStorefront = org?.orgType === "storefront";
    const drawerBg = isCommerce ? "#32323f" : isStorefront ? "#1c2333" : SIDEBAR_BG;

    const isActive = (item) =>
        item.exact ? pathname === item.href : pathname?.startsWith(item.href);

    return (
        <Drawer
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: DRAWER_WIDTH,
                    backgroundColor: drawerBg,
                    borderRight: "none",
                    display: "flex",
                    flexDirection: "column",
                },
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2.5, pt: 2.5, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Box sx={{ mb: 1.5, display: "flex", justifyContent: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={isCommerce ? "/commerce-cloud-logo.png" : isStorefront ? "/storefront-logo.png" : "/fullfilment_cloud_transparant.png"}
                        alt="Pythias Technologies"
                        style={{ width: "80%", maxWidth: 200, height: "auto" }}
                    />
                </Box>
                <Link href={`${base}/dashboard`} onClick={onClose} style={{ textDecoration: "none" }}>
                    {org?.name && (
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff" }}>
                            {org.name}
                        </Typography>
                    )}
                    {org?.tier && (
                        <Typography variant="caption" sx={{ color: SIDEBAR_TEXT_DIM, textTransform: "capitalize" }}>
                            {org.tier} plan
                        </Typography>
                    )}
                </Link>
            </Box>

            {/* Nav sections */}
            <Box sx={{
                flex: 1, overflowY: "auto", py: 1.5,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.15)", borderRadius: 2 },
            }}>
                {sections.map((section, si) => (
                    <Box key={section.label} sx={{ mb: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                display: "block", px: 2.5, pt: si === 0 ? 0.5 : 1.5, pb: 0.5,
                                color: SIDEBAR_TEXT_DIM,
                                textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, fontSize: "0.6rem",
                            }}
                        >
                            {section.label}
                        </Typography>
                        <List disablePadding>
                            {section.items.map((item) => {
                                const active = isActive(item);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        style={{ textDecoration: "none" }}
                                        {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}
                                    >
                                        <ListItemButton
                                            sx={{
                                                mx: 1, borderRadius: 1.5, mb: 0.25,
                                                py: 0.85, px: 1.5,
                                                backgroundColor: active ? SIDEBAR_ACTIVE_BG : "transparent",
                                                borderLeft: active ? `3px solid ${SIDEBAR_ACCENT}` : "3px solid transparent",
                                                transition: "background-color 120ms, border-color 120ms",
                                                "&:hover": { backgroundColor: active ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32, color: active ? SIDEBAR_ACTIVE_ICON : SIDEBAR_ICON, transition: "color 120ms" }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                    fontSize: "0.82rem",
                                                    fontWeight: active ? 600 : 400,
                                                    color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
                                                    noWrap: true,
                                                }}
                                            />
                                        </ListItemButton>
                                    </Link>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* Footer — account + sign out */}
            <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <Link href={`${base}/settings`} onClick={onClose} style={{ textDecoration: "none" }}>
                    <ListItemButton sx={{ borderRadius: 1.5, py: 0.85, px: 1.5, mb: 0.5, "&:hover": { backgroundColor: SIDEBAR_HOVER_BG } }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#6366f1" }}>
                                {initials}
                            </Avatar>
                        </ListItemIcon>
                        <ListItemText
                            primary={session?.user ? (session.user.firstName || session.user.userName) : "Account"}
                            secondary={session?.user?.userName ? `@${session.user.userName}` : undefined}
                            primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 500, color: SIDEBAR_TEXT }}
                            secondaryTypographyProps={{ fontSize: "0.7rem", color: SIDEBAR_TEXT_DIM }}
                        />
                    </ListItemButton>
                </Link>
                <ListItemButton
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    sx={{ borderRadius: 1.5, py: 0.85, px: 1.5, "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" } }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: "rgba(239,68,68,0.75)" }}>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Sign out"
                        primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(239,68,68,0.85)" }}
                    />
                </ListItemButton>
            </Box>
        </Drawer>
    );
}
