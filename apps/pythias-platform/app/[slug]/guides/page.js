"use client";
import { useState } from "react";
import {
    Box, Typography, Stack, Chip, Divider, Paper, List, ListItemButton,
    ListItemText, ListItemIcon, Collapse, useMediaQuery, useTheme,
    IconButton, Drawer, Button,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import BrushIcon from "@mui/icons-material/Brush";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import CropFreeIcon from "@mui/icons-material/CropFree";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import SellIcon from "@mui/icons-material/Sell";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import BuildIcon from "@mui/icons-material/Build";

// ─── Step component ──────────────────────────────────────────────────────────

function Step({ number, title, children }) {
    return (
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Box sx={{
                width: 28, height: 28, borderRadius: "50%", bgcolor: "#6366f1",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.78rem", fontWeight: 700, flexShrink: 0, mt: 0.25,
            }}>
                {number}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" component="div">{children}</Typography>
            </Box>
        </Box>
    );
}

function Note({ children, type = "info" }) {
    const colors = {
        info:    { bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.3)",  label: "Note" },
        tip:     { bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.3)",  label: "Tip" },
        warning: { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.3)",  label: "Warning" },
    };
    const c = colors[type];
    return (
        <Box sx={{ px: 2, py: 1.25, borderRadius: 1.5, bgcolor: c.bg, border: `1px solid ${c.border}`, mb: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.25, color: c.border }}>
                {c.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">{children}</Typography>
        </Box>
    );
}

function Section({ title, children }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "#6366f1" }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function GuideHeading({ icon, title, description, color = "#6366f1" }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                </Box>
                <Typography variant="h5" fontWeight={800}>{title}</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">{description}</Typography>
            <Divider sx={{ mt: 2 }} />
        </Box>
    );
}

// ─── Guide content ────────────────────────────────────────────────────────────

const GUIDES = {

    "blanks-overview": {
        label: "Creating Blanks",
        icon: <CheckroomIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<CheckroomIcon sx={{ color: "#6366f1" }} />}
                    title="Creating Blanks"
                    description="Blanks are the physical garments or products you print on. Each blank defines sizes, colors, wholesale costs, and retail prices that feed into products, inventory, and forecasting."
                />
                <Section title="What is a blank?">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        A blank represents a specific style — for example, a Gildan 5000 t-shirt. Each blank has:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>Style code</strong> — a unique identifier (e.g. <code>G5000</code>)</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Sizes</strong> — XS through 5XL, each with wholesale cost and retail price</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Colors</strong> — each color has a name, hex value, and optional image URL</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Print locations</strong> — where designs can be placed (front, back, left chest, etc.)</Typography></li>
                    </Box>
                </Section>
                <Section title="Creating a blank">
                    <Step number={1} title="Open Catalog → Blanks">
                        Navigate to <strong>Catalog → Blanks</strong> in the sidebar, then click <strong>+ Create Blank</strong>.
                    </Step>
                    <Step number={2} title="Enter the style info">
                        Fill in the style code, brand, description, and select the garment type. The style code must be unique within your account — it is used to match orders and inventory records.
                    </Step>
                    <Step number={3} title="Add sizes and pricing">
                        For each size you carry, enter the <strong>wholesale cost</strong> (what you pay) and the <strong>retail price</strong> (the base MSRP). These drive billing overage calculations and license fee estimates in reporting.
                    </Step>
                    <Step number={4} title="Add colors">
                        Click <strong>Add Color</strong> for each color variant you stock. Enter the color name exactly as it will appear on orders (case-sensitive for order matching). Add the hex code for display purposes.
                    </Step>
                    <Step number={5} title="Assign print locations">
                        Select which print locations apply to this blank. Print locations must be set up first in <strong>Edit Data → Print Locations</strong>.
                    </Step>
                    <Step number={6} title="Save and generate inventory">
                        After saving, click <strong>Generate Inventory</strong> to create an inventory record for every size/color combination. This only needs to be done once; new combos added later can be generated individually.
                    </Step>
                    <Note type="tip">
                        Keep style codes short and consistent with supplier codes. This makes it much easier to match incoming orders automatically.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "blanks-images": {
        label: "Adding Images",
        icon: <ImageIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<ImageIcon sx={{ color: "#0ea5e9" }} />}
                    title="Adding Blank Images"
                    description="Images on blanks are used to render product mockups and define the printable surface in the product designer."
                    color="#0ea5e9"
                />
                <Section title="Image types">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Each blank can have multiple images — one per print location (front, back, sleeve, etc.). Each image needs to show the garment flat and centered.
                    </Typography>
                    <Note type="info">
                        Images are stored in your CDN bucket. URLs should point to publicly accessible HTTPS images. Recommended size: <strong>1200 × 1200 px</strong> or larger, transparent PNG preferred.
                    </Note>
                </Section>
                <Section title="Adding an image to a blank">
                    <Step number={1} title="Open the blank">
                        Go to <strong>Catalog → Blanks</strong>, click the blank you want to edit, and open the <strong>Images</strong> tab.
                    </Step>
                    <Step number={2} title="Choose the print location">
                        Select the print location this image represents (e.g. Front, Back, Left Chest). You need one image per location you want to support.
                    </Step>
                    <Step number={3} title="Enter the image URL or upload">
                        Paste the CDN URL of the image, or use the upload button to push a new image to your bucket. The image will appear in the preview immediately.
                    </Step>
                    <Step number={4} title="Set a color-specific image (optional)">
                        If you need different images per color (e.g. white blank vs. black blank), expand the color row and add a color-specific override image. This image will be used instead of the default when that color is selected in the product designer.
                    </Step>
                    <Step number={5} title="Save">
                        Click <strong>Save</strong>. The image will now appear in product mockups and the design placement editor.
                    </Step>
                    <Note type="tip">
                        For the best mockup quality, use images with a consistent photo angle across all colors. Mismatched angles will make mockups look inconsistent across product listings.
                    </Note>
                </Section>
                <Section title="Troubleshooting">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Image not showing in product designer:</strong> Make sure the URL is HTTPS and publicly accessible. Test it in a browser tab first.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Image appears stretched:</strong> Ensure the source image is square (same width and height). Non-square images will be letterboxed.
                    </Typography>
                </Section>
            </Box>
        ),
    },

    "blanks-printarea": {
        label: "Print Area Boxes",
        icon: <CropFreeIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<CropFreeIcon sx={{ color: "#f97316" }} />}
                    title="Print Area Boxes"
                    description="Print area boxes define exactly where designs can be placed on a blank. They control the maximum size, position, and safe zone for each print location."
                    color="#f97316"
                />
                <Section title="What is a print area box?">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        A print area box is a rectangular region drawn on top of the blank image. It defines:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>Position</strong> — X/Y offset from the top-left of the image</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Dimensions</strong> — width and height of the printable area in pixels (relative to image dimensions)</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Max print size</strong> — the real-world maximum print size in inches, used for file validation</Typography></li>
                    </Box>
                </Section>
                <Section title="Setting up a print area">
                    <Step number={1} title="Open the blank and select a location">
                        In <strong>Catalog → Blanks</strong>, open the blank and go to the <strong>Print Areas</strong> tab. Select the print location (e.g. Front).
                    </Step>
                    <Step number={2} title="Draw the box on the image">
                        The blank image will appear in the editor. Click and drag to draw a rectangle over the printable area. Position it to match the actual printable zone of the garment — not too close to seams or collars.
                    </Step>
                    <Step number={3} title="Fine-tune with coordinates">
                        After drawing, you can type exact X, Y, width, and height values in the fields below the preview. This is useful for consistency across similar blanks.
                    </Step>
                    <Step number={4} title="Set the real-world max size">
                        Enter the maximum print width and height in inches. For example, a standard full-front on a t-shirt is typically <strong>12" × 14"</strong>. This will be used to validate design file resolution.
                    </Step>
                    <Step number={5} title="Save the print area">
                        Click <strong>Save Print Area</strong>. Repeat for each print location (front, back, etc.) that this blank supports.
                    </Step>
                    <Note type="warning">
                        If you resize a blank image later, the print area coordinates will no longer be accurate. Re-draw the print area boxes after any image changes.
                    </Note>
                    <Note type="tip">
                        Copy print area settings from a similar blank to save time — many blank styles from the same brand share the same print area dimensions.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "designs-overview": {
        label: "Creating Designs",
        icon: <BrushIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<BrushIcon sx={{ color: "#ec4899" }} />}
                    title="Creating Designs"
                    description="Designs are the artwork files linked to specific print types. A design can be shared across many products and is the core unit for tracking art files, licensing, and production routing."
                    color="#ec4899"
                />
                <Section title="What is a design?">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        A design stores your artwork and its metadata. Each design has:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>SKU</strong> — unique identifier used in order matching</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Print type</strong> — DTF, embroidery, sublimation, etc.</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Image/file URLs</strong> — production-ready art files</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>License holder</strong> — if the design is licensed, tracks the royalty payer</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Tags</strong> — season, gender, theme, sport, etc. (from Edit Data)</Typography></li>
                    </Box>
                </Section>
                <Section title="Creating a design manually">
                    <Step number={1} title="Navigate to Catalog → Designs">
                        Click <strong>+ New Design</strong> in the top right.
                    </Step>
                    <Step number={2} title="Enter the design SKU">
                        The SKU is critical — it must match the design identifier used in your order source. For example, if Etsy sends <code>DSGN-0042</code>, your design SKU must be <code>DSGN-0042</code>.
                    </Step>
                    <Step number={3} title="Select the print type">
                        Choose from your configured print types (set up in Edit Data). This routes the design to the correct production queue.
                    </Step>
                    <Step number={4} title="Upload or enter the art file URL">
                        Paste the CDN URL of the production-ready file, or upload directly. For DTF the file should be a high-res PNG. For embroidery, a DST file will be expected.
                    </Step>
                    <Step number={5} title="Fill in tags and metadata">
                        Select the applicable season, gender, theme, and other tags. These are used for filtering, reporting, and marketplace listing generation.
                    </Step>
                    <Step number={6} title="Assign a license holder (if licensed)">
                        If this design is licensed artwork, select the license holder from your configured list. This will automatically calculate and deduct royalty fees from net revenue in reports and forecasting.
                    </Step>
                    <Note type="tip">
                        For a design to be matched automatically when an order comes in, the SKU in the order item must exactly match the design SKU. Check for extra spaces or capitalization differences.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "products-manual": {
        label: "Products (Manual)",
        icon: <ShoppingCartIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<ShoppingCartIcon sx={{ color: "#10b981" }} />}
                    title="Creating Products Manually"
                    description="Products combine a blank, one or more designs, and size/color variants into a listable item. A product is what gets pushed to marketplaces and matched to incoming orders."
                    color="#10b981"
                />
                <Section title="Product structure">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Each product has:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>Base blank</strong> — the garment style</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Design slots</strong> — one design per print location (front, back, etc.)</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Variants</strong> — size + color combinations with individual SKUs and prices</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Marketplace listings</strong> — linked listings on Etsy, Shopify, etc.</Typography></li>
                    </Box>
                </Section>
                <Section title="Creating a product">
                    <Step number={1} title="Go to Catalog → Products and click + New Product">
                        Select the blank first — this determines what sizes, colors, and print locations are available.
                    </Step>
                    <Step number={2} title="Assign designs to print locations">
                        For each print location on the blank, optionally assign a design. At least one design is required. The design SKU drives production routing.
                    </Step>
                    <Step number={3} title="Configure variants">
                        Select which size/color combinations you want to sell. You can enable or disable individual variants. Each variant gets a unique SKU (usually auto-generated from the blank, design, size, and color codes).
                    </Step>
                    <Step number={4} title="Set retail prices">
                        Enter the retail price per variant or set a base price with size upcharges. These prices are used in sales reports.
                    </Step>
                    <Step number={5} title="Add title, description, and tags">
                        Fill in the product title and description. These are used as defaults when pushing to marketplaces. Tags pull from your Edit Data categories.
                    </Step>
                    <Step number={6} title="Link marketplace listings (optional)">
                        If this product already exists on a marketplace, link it here. Linked listings will receive inventory and status updates automatically.
                    </Step>
                    <Note type="tip">
                        SKU consistency is critical. If a marketplace sends an order with SKU <code>SHIRT-BLK-LG</code>, your product variant SKU must match exactly.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "products-ai": {
        label: "Products (AI)",
        icon: <AutoFixHighIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<AutoFixHighIcon sx={{ color: "#8b5cf6" }} />}
                    title="Creating Products with AI"
                    description="AI product creation generates listing titles, descriptions, tags, and mockup images automatically from your design and blank combination."
                    color="#8b5cf6"
                />
                <Section title="What AI generates">
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>Listing title</strong> — SEO-optimized title based on design and blank metadata</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Description</strong> — marketplace-ready product description</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Tags</strong> — relevant search tags for the marketplace</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Mockup image</strong> — composited design-on-blank image using your print area boxes</Typography></li>
                    </Box>
                    <Note type="info">
                        AI generation works best when the design has detailed metadata (season, theme, gender, sport) and the blank has a clean product image with an accurate print area box.
                    </Note>
                </Section>
                <Section title="Using AI to create a product">
                    <Step number={1} title="Start a new product or open an existing one">
                        Navigate to <strong>Catalog → Products → + New Product</strong>.
                    </Step>
                    <Step number={2} title="Select the blank and assign designs">
                        Complete the blank and design assignment as in manual creation. The AI uses this information to generate content.
                    </Step>
                    <Step number={3} title='Click "Generate with AI"'>
                        The AI will analyze the design metadata, blank type, and your configured brand voice to produce a draft title, description, and tags.
                    </Step>
                    <Step number={4} title="Review and edit the generated content">
                        The AI output is always a starting point — review and edit the title and description before publishing. Pay special attention to accuracy of size/material callouts.
                    </Step>
                    <Step number={5} title="Generate mockup images">
                        Click <strong>Generate Mockup</strong> to composite the design onto the blank image using the print area box coordinates. A mockup will be created for each selected color.
                    </Step>
                    <Step number={6} title="Generate AI video (optional)">
                        For supported designs, click <strong>Generate Video</strong> to create a short product video using Kling AI. This incurs an <strong>$8/video</strong> upcharge tracked on your billing page.
                    </Step>
                    <Note type="tip">
                        Run AI generation on a batch of products at once using the bulk action in the Products list — select multiple rows, then choose <strong>Generate Content</strong>.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "edit-data": {
        label: "Edit Data",
        icon: <ListAltIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<ListAltIcon sx={{ color: "#14b8a6" }} />}
                    title="Edit Data"
                    description="Edit Data manages the dropdown values used across blanks, designs, and products. Adding values here populates the selection menus on all creation forms."
                    color="#14b8a6"
                />
                <Section title="Categories in Edit Data">
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 2 }}>
                        {[
                            ["Seasons", "Spring, Summer, Fall, Winter, All Season"],
                            ["Genders", "Men, Women, Youth, Unisex"],
                            ["Themes", "Holiday, Sports, Funny, Inspirational"],
                            ["Sport Used For", "Baseball, Football, Soccer…"],
                            ["Departments", "Internal org groupings"],
                            ["Brands", "Your design brand names"],
                            ["Suppliers", "Who you source blanks from"],
                            ["Vendors", "Third-party service vendors"],
                            ["Print Types", "DTF, Embroidery, Sublimation… + pricing"],
                            ["Repull Reasons", "Reasons for production repulls"],
                            ["Categories", "General product categories"],
                            ["Print Locations", "Front, Back, Left Chest…"],
                        ].map(([name, desc]) => (
                            <Box key={name} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{name}</Typography>
                                <Typography variant="caption" color="text.secondary">{desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Section>
                <Section title="Adding values">
                    <Step number={1} title="Go to Catalog → Edit Data">
                        You will see a card for each category.
                    </Step>
                    <Step number={2} title="Type the new value in the input and press Enter">
                        The value will appear immediately as a chip. It is now available in all creation forms that use that category.
                    </Step>
                    <Step number={3} title="Remove a value by clicking the × on its chip">
                        A confirmation dialog will appear. Removing a value does not delete existing records that already use it — it only removes it from the dropdown for future entries.
                    </Step>
                </Section>
                <Section title="Print types with pricing">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Print types support an optional <strong>additional price</strong> — an upcharge added to orders that use this print type. This is useful for premium processes like embroidery or foil printing.
                    </Typography>
                    <Step number={1} title="Type the print type name in the input">
                        For example: <code>Embroidery</code>
                    </Step>
                    <Step number={2} title="Enter the upcharge in the +$ field">
                        For example, enter <code>3.50</code> to add $3.50 to any order using this print type.
                    </Step>
                    <Step number={3} title="Press Enter or click the + button">
                        The print type will appear as a chip showing <strong>Embroidery (+$3.50)</strong>.
                    </Step>
                    <Note type="info">
                        Leave the price field empty (or $0) for standard print types with no upcharge, like basic DTF.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "converters": {
        label: "Converters",
        icon: <CompareArrowsIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<CompareArrowsIcon sx={{ color: "#f59e0b" }} />}
                    title="Converters"
                    description="Converters translate incoming SKU strings from marketplaces into your internal design and blank identifiers. They are essential when your suppliers or marketplaces use different naming conventions."
                    color="#f59e0b"
                />
                <Section title="What is a converter?">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        When an order arrives, Pythias reads the item SKU and tries to match it to a design and blank. If the marketplace SKU format is different from your internal format, a converter translates it.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Example: Etsy sends <code>ETSY-SHIRT-BLK-LG-CHRISTMAS</code> but your internal SKU is <code>G5000-BLK-LG-XMAS001</code>. A converter maps one to the other.
                    </Typography>
                    <Note type="info">
                        Converters run at order ingest time. If no converter matches, the system falls back to direct SKU matching.
                    </Note>
                </Section>
                <Section title="Creating a converter">
                    <Step number={1} title="Go to Catalog → Converters and click + New Converter">
                        Give the converter a descriptive name, e.g. <em>Etsy Christmas Shirts</em>.
                    </Step>
                    <Step number={2} title="Enter the source pattern">
                        This is the SKU pattern coming from the marketplace. You can use a fixed string for exact matches, or a pattern with wildcards for flexible matching. Example: <code>ETSY-*-CHRISTMAS</code>
                    </Step>
                    <Step number={3} title="Map to the internal design SKU">
                        Enter the design SKU this pattern should resolve to. Example: <code>XMAS001</code>
                    </Step>
                    <Step number={4} title="Map the blank and size/color extraction">
                        Specify how the blank style code, color, and size are extracted from the incoming SKU. You can map positional segments (e.g. segment 2 = color, segment 3 = size) or use lookup tables.
                    </Step>
                    <Step number={5} title="Save and test">
                        After saving, use the <strong>Test Converter</strong> button to paste a sample SKU and verify the output matches what you expect.
                    </Step>
                    <Note type="tip">
                        Start broad with a wildcard pattern, test it, then narrow it down if it over-matches unrelated SKUs.
                    </Note>
                </Section>
                <Section title="Converter priority">
                    <Typography variant="body2" color="text.secondary">
                        When multiple converters could match an incoming SKU, the system uses the one with the highest specificity (fewest wildcards). You can also manually set a priority order in the Converters list by dragging rows to reorder them.
                    </Typography>
                </Section>
            </Box>
        ),
    },

    "marketplaces-overview": {
        label: "Marketplaces",
        icon: <StorefrontIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<StorefrontIcon sx={{ color: "#6366f1" }} />}
                    title="Marketplaces"
                    description="Marketplaces are the selling channels where your products are listed — Etsy, Shopify, TikTok Shop, eBay, Walmart, and others. Pythias connects to these channels to pull orders and optionally push listings."
                    color="#6366f1"
                />
                <Section title="Supported channels">
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mb: 2 }}>
                        {[
                            ["Etsy", "Order pull + listing push", "Direct OAuth"],
                            ["Shopify", "Order pull + listing push", "API key"],
                            ["TikTok Shop", "Order pull", "OAuth"],
                            ["eBay", "Order pull", "OAuth"],
                            ["Walmart", "Listing push", "API credentials"],
                            ["Amazon", "Order pull", "MWS credentials"],
                            ["ShipStation", "Order sync", "API key"],
                        ].map(([name, caps, auth]) => (
                            <Box key={name} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{caps}</Typography>
                                <Chip label={auth} size="small" sx={{ mt: 0.5, height: 18, fontSize: "0.62rem" }} />
                            </Box>
                        ))}
                    </Box>
                </Section>
                <Section title="Connecting an integration">
                    <Step number={1} title="Go to Account → Integrations">
                        Click <strong>+ Add Integration</strong> and select the channel type.
                    </Step>
                    <Step number={2} title="Complete authentication">
                        <Box>
                            <Typography variant="body2" color="text.secondary">For OAuth channels (Etsy, TikTok, eBay): you will be redirected to the platform to authorize Pythias. Complete the flow and you will be redirected back.</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>For API key channels (Shopify, Walmart): enter the API key and secret in the fields provided. These are found in the channel&apos;s developer or partner portal.</Typography>
                        </Box>
                    </Step>
                    <Step number={3} title="Configure order pull settings">
                        Set the order source name exactly as it will appear on incoming orders. This value is used for marketplace filtering and reporting. Enable or disable automatic order pull.
                    </Step>
                    <Step number={4} title="Test the connection">
                        Click <strong>Test Connection</strong>. A successful test will show the number of recent orders available. If it fails, double-check your API credentials.
                    </Step>
                    <Note type="warning">
                        For Etsy and TikTok, OAuth tokens expire. If orders stop pulling, re-authorize the integration from the Integrations page.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "marketplaces-listings": {
        label: "Marketplace Listings",
        icon: <SellIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<SellIcon sx={{ color: "#0ea5e9" }} />}
                    title="Marketplace Listings"
                    description="Listings connect your internal products to specific listings on a marketplace channel. Pythias can push inventory, prices, and product data to connected listings."
                    color="#0ea5e9"
                />
                <Section title="Linking a product to a marketplace listing">
                    <Step number={1} title="Open the product in Catalog → Products">
                        Go to the <strong>Marketplace Listings</strong> tab within the product.
                    </Step>
                    <Step number={2} title="Click + Add Listing">
                        Select the integration (channel) and enter the marketplace listing ID. For Etsy this is the listing number from the URL. For Shopify it is the product ID from the admin.
                    </Step>
                    <Step number={3} title="Map variants">
                        If the marketplace listing has multiple variants (sizes, colors), map each marketplace variant ID to the corresponding internal variant SKU. This ensures inventory deductions and order matching are accurate.
                    </Step>
                    <Step number={4} title="Enable syncing">
                        Turn on <strong>Inventory Sync</strong> and/or <strong>Price Sync</strong> as needed. When enabled, changes to your internal product will push to the marketplace automatically.
                    </Step>
                </Section>
                <Section title="Pushing a new listing">
                    <Step number={1} title="Build the product first">
                        Complete the product title, description, tags, images, and variants before pushing.
                    </Step>
                    <Step number={2} title='Click "Push to Marketplace"'>
                        Select the integration and click push. For Etsy and Shopify, a new draft listing will be created in your seller account.
                    </Step>
                    <Step number={3} title="Review and publish on the marketplace">
                        Pythias creates listings in draft state. Log into the marketplace to review and publish. Some platforms require category selection or additional fields to be completed before publishing.
                    </Step>
                    <Note type="info">
                        Walmart and Amazon listings require additional compliance data (UPCs, brand registry, category attributes). Ensure this is configured before pushing.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "inventory-overview": {
        label: "Inventory Overview",
        icon: <WarehouseIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<WarehouseIcon sx={{ color: "#6366f1" }} />}
                    title="Inventory Overview"
                    description="Pythias tracks two types of inventory: blank inventory (physical garments in stock) and product inventory (finished/assembled units). Both are updated automatically as orders are processed."
                />
                <Section title="Blank vs. product inventory">
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Blank Inventory</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tracks raw garments by style, color, and size. Updated when inventory orders are received and when production consumes units. Used for reorder point alerting and the blanks forecast.
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Product Inventory</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tracks finished products by SKU. Used to push stock levels to marketplaces and flag out-of-stock conditions. Decremented when orders are fulfilled.
                            </Typography>
                        </Box>
                    </Box>
                </Section>
                <Section title="Generating blank inventory">
                    <Step number={1} title="Create the blank first">
                        Inventory records are built from the size/color matrix defined on the blank. Make sure all sizes and colors you carry are added to the blank before generating inventory.
                    </Step>
                    <Step number={2} title="Click Generate Inventory on the blank">
                        Go to <strong>Catalog → Blanks</strong>, open the blank, and click <strong>Generate Inventory</strong>. This creates one inventory record per size/color combination.
                    </Step>
                    <Step number={3} title="Set reorder points">
                        In <strong>Orders → Inventory</strong>, find each blank's inventory rows and set:
                        <Box component="ul" sx={{ pl: 2.5, mt: 0.5, "& li": { mb: 0.25 } }}>
                            <li><Typography variant="body2" color="text.secondary"><strong>Order at quantity</strong> — trigger a reorder when on-hand drops to this level</Typography></li>
                            <li><Typography variant="body2" color="text.secondary"><strong>Desired order quantity</strong> — how many units to order per reorder</Typography></li>
                        </Box>
                    </Step>
                    <Note type="tip">
                        Use the <strong>Blanks Forecast</strong> in Reports to see AI-projected demand and suggested order quantities for the next 12 months.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "inventory-orders": {
        label: "Inventory Orders",
        icon: <LocalShippingIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<LocalShippingIcon sx={{ color: "#10b981" }} />}
                    title="Creating Inventory Orders"
                    description="Inventory orders track purchase orders sent to your blank suppliers. Creating one reserves the units as pending and receiving it updates your on-hand counts."
                    color="#10b981"
                />
                <Section title="Creating an inventory order">
                    <Step number={1} title="Go to Orders → Inventory → Create Order">
                        Click <strong>Create Inventory Order</strong> (or use the <em>Create Order</em> tab within the Inventory page).
                    </Step>
                    <Step number={2} title="Select the supplier">
                        Choose the supplier from your configured vendors. If the supplier is not listed, add them in <strong>Catalog → Edit Data → Suppliers</strong> first.
                    </Step>
                    <Step number={3} title="Add line items">
                        For each SKU you are ordering, click <strong>+ Add Item</strong> and select the blank, color, and size. Enter the quantity and unit cost. The total will calculate automatically.
                    </Step>
                    <Step number={4} title="Use Suggested Order (optional)">
                        Click <strong>Suggested Order</strong> to auto-populate line items based on blanks that have fallen below their reorder point or are projected to run out within 90 days. Review and adjust quantities before confirming.
                    </Step>
                    <Step number={5} title="Submit the order">
                        Click <strong>Submit Order</strong>. The ordered quantities will appear as <strong>Pending</strong> in inventory counts immediately — this prevents double-ordering while awaiting delivery.
                    </Step>
                </Section>
                <Section title="Receiving an order">
                    <Step number={1} title="Open the inventory order">
                        In <strong>Orders → Inventory</strong>, find the order with status <em>Submitted</em> and click it.
                    </Step>
                    <Step number={2} title="Mark items as received">
                        As boxes arrive, check off each line item. You can receive partial quantities — enter the received amount per line. The system will mark items as partially received.
                    </Step>
                    <Step number={3} title="Confirm receipt">
                        When all items are checked, click <strong>Confirm Receipt</strong>. The pending quantities will move to on-hand, and your blank inventory counts will update immediately.
                    </Step>
                    <Note type="tip">
                        If a supplier ships a short quantity, you can leave the remaining amount as pending and create a follow-up order later.
                    </Note>
                </Section>
            </Box>
        ),
    },

    "inventory-outofstock": {
        label: "Out of Stock Orders",
        icon: <InventoryIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<InventoryIcon sx={{ color: "#ef4444" }} />}
                    title="Out of Stock Orders"
                    description="When a production order cannot be fulfilled because a blank or finished product is out of stock, Pythias flags it and routes it to the out-of-stock queue for resolution."
                    color="#ef4444"
                />
                <Section title="How out-of-stock is detected">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        When an order is pulled from a marketplace, Pythias checks whether:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary">The required blank (style + color + size) has sufficient on-hand inventory</Typography></li>
                        <li><Typography variant="body2" color="text.secondary">The product variant is marked as in-stock in product inventory</Typography></li>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        If either check fails, the order items are flagged as out-of-stock and removed from the normal production queue until resolved.
                    </Typography>
                </Section>
                <Section title="Resolving out-of-stock items">
                    <Step number={1} title="Go to Production → Returns to find the out-of-stock queue">
                        Out-of-stock items appear with a status of <em>Out of Stock</em>. You can filter to show only these items.
                    </Step>
                    <Step number={2} title="Receive inventory or substitute">
                        If the blank has arrived, receive the inventory order (see <em>Receiving an Order</em> guide) and the items will automatically become eligible for production.
                    </Step>
                    <Step number={3} title="Manually release if substituting">
                        If you are substituting a different color or size, update the item's blank assignment and click <strong>Release to Queue</strong>. The item will re-enter the production queue.
                    </Step>
                    <Step number={4} title="Cancel if unresolvable">
                        If an item cannot be fulfilled (discontinued blank, design issue), use <strong>Cancel Item</strong> to mark it as canceled. This will notify the marketplace integration to refund or cancel the order line.
                    </Step>
                    <Note type="warning">
                        Do not leave out-of-stock items unresolved for more than a few days — most marketplaces have SLA requirements for order fulfillment and will flag late shipments.
                    </Note>
                </Section>
                <Section title="Preventing out-of-stock">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Use the following tools proactively to avoid stockouts:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary">Set <strong>reorder points</strong> on all blank inventory rows</Typography></li>
                        <li><Typography variant="body2" color="text.secondary">Check the <strong>Blanks Forecast</strong> in Reports weekly to spot SKUs running low</Typography></li>
                        <li><Typography variant="body2" color="text.secondary">Use the <strong>Suggested Order</strong> feature when creating inventory orders</Typography></li>
                    </Box>
                </Section>
            </Box>
        ),
    },
    "returns-overview": {
        label: "Processing Returns",
        icon: <AssignmentReturnIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<AssignmentReturnIcon sx={{ color: "#f97316" }} />}
                    title="Processing Returns"
                    description="Returns are customer-sent items that come back to your warehouse. Pythias lets you receive them, add them to product inventory for resale or fulfillment, and route them back through production if needed."
                    color="#f97316"
                />
                <Section title="Return workflow overview">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        When a customer returns an item, there are three possible outcomes:
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5, mb: 2 }}>
                        {[
                            ["Restock", "Item is in good condition — add to product inventory for reuse on a future out-of-stock order."],
                            ["Repull", "Item has a defect or print issue — send it back through production with a new blank."],
                            ["Discard", "Item is unsellable — log it for records and dispose."],
                        ].map(([title, desc]) => (
                            <Box key={title} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>{title}</Typography>
                                <Typography variant="caption" color="text.secondary">{desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Section>
                <Section title="Receiving a return by SKU / UPC">
                    <Step number={1} title="Go to Production → Returns">
                        The Returns page has a scan/lookup field at the top. This is where you process every incoming return.
                    </Step>
                    <Step number={2} title="Scan or type the item SKU or UPC">
                        Scan the barcode on the item label, or type the SKU or UPC manually. Pythias will look up the matching product variant and display it for confirmation.
                    </Step>
                    <Step number={3} title="Confirm the item details">
                        Review the displayed product — blank style, color, size, and design SKU. If the details are correct, proceed. If the SKU is not found, see the <em>SKU not found</em> section below.
                    </Step>
                    <Step number={4} title="Choose the action: Restock or Repull">
                        <Box>
                            <Typography variant="body2" color="text.secondary"><strong>Restock</strong> — click <em>Add to Inventory</em>. The item&apos;s product inventory quantity increments by 1. It can now be used to fulfill an out-of-stock order without reprinting.</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}><strong>Repull</strong> — click <em>Send to Repull</em>. A new production item is created with repull status and a reason you select. It enters the production queue for reprinting on a new blank.</Typography>
                        </Box>
                    </Step>
                    <Note type="tip">
                        Restocked items appear in Product Inventory with <strong>location: returns</strong>. When an out-of-stock order needs that SKU, it will pull from the returns stock first before flagging as unresolvable.
                    </Note>
                </Section>
                <Section title="Manually finding a return (blank + design lookup)">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        If the item label is missing or the barcode is unreadable, use the manual lookup form:
                    </Typography>
                    <Step number={1} title="Switch to Manual Lookup">
                        Click <strong>Manual Lookup</strong> on the Returns page.
                    </Step>
                    <Step number={2} title="Select blank, color, size, and design SKU">
                        Choose the blank style from the dropdown, then select the color and size. Type the design SKU exactly as it appears on your design record.
                    </Step>
                    <Step number={3} title="Confirm and process">
                        The system constructs the variant SKU (<code>BLANK_COLOR_SIZE_DESIGNSKU</code>) and looks up or creates the product inventory record. Proceed with Restock or Repull as above.
                    </Step>
                    <Note type="warning">
                        Manual lookup bypasses barcode verification. Double-check the design SKU before confirming — an incorrect entry will add inventory to the wrong variant.
                    </Note>
                </Section>
                <Section title="SKU not found">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        If the scan returns <em>"Look up SKU or UPC on the design page"</em>, the variant is not in the system. This usually means:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.5 } }}>
                        <li><Typography variant="body2" color="text.secondary">The design SKU changed after the original order was placed</Typography></li>
                        <li><Typography variant="body2" color="text.secondary">The item was produced before the product was set up in Pythias</Typography></li>
                        <li><Typography variant="body2" color="text.secondary">The label has a typo or belongs to a different system</Typography></li>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Use <strong>Manual Lookup</strong> to locate the correct design and blank, or go to <strong>Catalog → Designs</strong> and search for the design to find its current SKU.
                    </Typography>
                </Section>
            </Box>
        ),
    },

    "returns-repulls": {
        label: "Repulls",
        icon: <BuildIcon fontSize="small" />,
        render: () => (
            <Box>
                <GuideHeading
                    icon={<BuildIcon sx={{ color: "#8b5cf6" }} />}
                    title="Repulls"
                    description="A repull is when a finished item needs to be reprinted due to a defect, print error, or quality issue. Repulls consume a new blank from inventory and go back through the full production queue."
                    color="#8b5cf6"
                />
                <Section title="When to repull vs. restock">
                    <Box component="ul" sx={{ pl: 2.5, "& li": { mb: 0.75 } }}>
                        <li><Typography variant="body2" color="text.secondary"><strong>Repull</strong> — print defect, ink bleed, misalignment, wrong design, damaged garment that must be replaced</Typography></li>
                        <li><Typography variant="body2" color="text.secondary"><strong>Restock</strong> — item is in good condition (wrong size ordered, customer changed mind, seasonal overstock)</Typography></li>
                    </Box>
                    <Note type="info">
                        Repulls use a new blank from your blank inventory. Make sure the blank is in stock before triggering a repull, or the new item will immediately enter the out-of-stock queue.
                    </Note>
                </Section>
                <Section title="Creating a repull from a return">
                    <Step number={1} title="Scan the item on the Returns page">
                        Look up the item by SKU or UPC as described in the <em>Processing Returns</em> guide.
                    </Step>
                    <Step number={2} title='Click "Send to Repull"'>
                        A dialog will appear asking you to select a <strong>repull reason</strong>. Choose from your configured reasons (set up in <strong>Catalog → Edit Data → Repull Reasons</strong>).
                    </Step>
                    <Step number={3} title="Confirm the repull">
                        Click <strong>Confirm</strong>. A new production item is created with:
                        <Box component="ul" sx={{ pl: 2.5, mt: 0.5, "& li": { mb: 0.25 } }}>
                            <li><Typography variant="body2" color="text.secondary">The same blank, color, size, and design as the original</Typography></li>
                            <li><Typography variant="body2" color="text.secondary">Status: <em>Repull</em></Typography></li>
                            <li><Typography variant="body2" color="text.secondary">The repull reason logged for reporting</Typography></li>
                        </Box>
                    </Step>
                    <Step number={4} title="The item enters the production queue">
                        The repull item will appear in the production queue with the repull reason shown. It is processed the same as a new order — Print Labels → DTF/production → Shipping.
                    </Step>
                </Section>
                <Section title="Creating a repull from an existing order item">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You can also trigger a repull directly from within an order — for example if a print error is caught before the item ships:
                    </Typography>
                    <Step number={1} title="Open the order in Orders">
                        Find the order and open it.
                    </Step>
                    <Step number={2} title='Click "Repull" on the item'>
                        Each item in the order has a repull button. Click it and select the reason.
                    </Step>
                    <Step number={3} title="A replacement item is created">
                        The original item is marked as repulled. A new item is created with the same specs and enters the production queue.
                    </Step>
                    <Note type="tip">
                        Repull reasons feed directly into the <strong>Reports</strong> page where you can see defect rates by print type, blank, or design. Logging reasons consistently helps you identify recurring issues.
                    </Note>
                </Section>
                <Section title="Repull reasons setup">
                    <Typography variant="body2" color="text.secondary">
                        Repull reasons are managed in <strong>Catalog → Edit Data → Repull Reasons</strong>. Add specific reasons like <em>Ink Bleed</em>, <em>Misprint</em>, <em>Garment Hole</em>, <em>Wrong Design</em>, <em>Customer Error</em> to make your reporting meaningful.
                    </Typography>
                </Section>
            </Box>
        ),
    },

};

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV = [
    {
        label: "Blanks",
        icon: <CheckroomIcon fontSize="small" />,
        items: ["blanks-overview", "blanks-images", "blanks-printarea"],
    },
    {
        label: "Designs & Products",
        icon: <BrushIcon fontSize="small" />,
        items: ["designs-overview", "products-manual", "products-ai"],
    },
    {
        label: "Edit Data",
        icon: <ListAltIcon fontSize="small" />,
        items: ["edit-data"],
    },
    {
        label: "Converters",
        icon: <CompareArrowsIcon fontSize="small" />,
        items: ["converters"],
    },
    {
        label: "Marketplaces",
        icon: <StorefrontIcon fontSize="small" />,
        items: ["marketplaces-overview", "marketplaces-listings"],
    },
    {
        label: "Inventory",
        icon: <WarehouseIcon fontSize="small" />,
        items: ["inventory-overview", "inventory-orders", "inventory-outofstock"],
    },
];

function GuideNav({ selected, onSelect, onClose }) {
    const [open, setOpen] = useState(() => {
        const initial = {};
        for (const section of NAV) {
            initial[section.label] = section.items.includes(selected);
        }
        return initial;
    });

    return (
        <Box sx={{ width: 240, flexShrink: 0 }}>
            {NAV.map(section => {
                const isExpanded = !!open[section.label];
                return (
                    <Box key={section.label}>
                        <ListItemButton
                            onClick={() => setOpen(o => ({ ...o, [section.label]: !o[section.label] }))}
                            sx={{ px: 1.5, py: 1, borderRadius: 1.5, mb: 0.25 }}
                        >
                            <ListItemIcon sx={{ minWidth: 30, color: "text.secondary" }}>{section.icon}</ListItemIcon>
                            <ListItemText
                                primary={section.label}
                                primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 700 }}
                            />
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </ListItemButton>
                        <Collapse in={isExpanded}>
                            <List disablePadding sx={{ pl: 1.5 }}>
                                {section.items.map(id => {
                                    const guide = GUIDES[id];
                                    const isActive = selected === id;
                                    return (
                                        <ListItemButton
                                            key={id}
                                            onClick={() => { onSelect(id); onClose?.(); }}
                                            sx={{
                                                px: 1.5, py: 0.75, borderRadius: 1.5, mb: 0.2,
                                                borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
                                                bgcolor: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 26, color: isActive ? "#6366f1" : "text.disabled" }}>
                                                {guide.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={guide.label}
                                                primaryTypographyProps={{
                                                    fontSize: "0.78rem",
                                                    fontWeight: isActive ? 600 : 400,
                                                    color: isActive ? "#6366f1" : "text.secondary",
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </Box>
                );
            })}
        </Box>
    );
}

export default function GuidesPage() {
    const [selected, setSelected] = useState("blanks-overview");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const guide = GUIDES[selected];

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            {/* Mobile top bar */}
            {isMobile && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton size="small" onClick={() => setDrawerOpen(true)}>
                        <MenuIcon fontSize="small" />
                    </IconButton>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <MenuBookIcon sx={{ color: "#6366f1", fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={700}>Guides</Typography>
                    </Stack>
                    <Box sx={{ flex: 1 }} />
                    <Chip label={guide?.label} size="small" sx={{ fontWeight: 600 }} />
                </Box>
            )}

            <Box sx={{ display: "flex", maxWidth: 1100, mx: "auto", px: { xs: 0, md: 3 }, py: { xs: 0, md: 4 }, gap: 4 }}>

                {/* Desktop sidebar */}
                {!isMobile && (
                    <Box sx={{ position: "sticky", top: 24, alignSelf: "flex-start" }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, px: 1.5 }}>
                            <MenuBookIcon sx={{ color: "#6366f1" }} />
                            <Typography variant="subtitle1" fontWeight={800}>Guides</Typography>
                        </Stack>
                        <GuideNav selected={selected} onSelect={setSelected} />
                    </Box>
                )}

                {/* Mobile drawer */}
                <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 260, p: 2 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <MenuBookIcon sx={{ color: "#6366f1" }} />
                        <Typography variant="subtitle1" fontWeight={800}>Guides</Typography>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size="small" onClick={() => setDrawerOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                    <GuideNav selected={selected} onSelect={setSelected} onClose={() => setDrawerOpen(false)} />
                </Drawer>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, py: { xs: 2, md: 0 } }}>
                    {guide?.render()}

                    {/* Bottom nav */}
                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" justifyContent="space-between">
                        {(() => {
                            const allIds = NAV.flatMap(s => s.items);
                            const idx = allIds.indexOf(selected);
                            const prev = idx > 0 ? allIds[idx - 1] : null;
                            const next = idx < allIds.length - 1 ? allIds[idx + 1] : null;
                            return (
                                <>
                                    {prev ? (
                                        <Button size="small" variant="outlined" onClick={() => setSelected(prev)}>
                                            ← {GUIDES[prev]?.label}
                                        </Button>
                                    ) : <Box />}
                                    {next ? (
                                        <Button size="small" variant="outlined" onClick={() => setSelected(next)}>
                                            {GUIDES[next]?.label} →
                                        </Button>
                                    ) : <Box />}
                                </>
                            );
                        })()}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}
